const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const injectedSource = fs.readFileSync(path.join(__dirname, "..", "src", "injected.js"), "utf8");

function createElement(elementsById) {
  return {
    style: {},
    dataset: {},
    children: [],
    firstChild: null,
    appendChild(child) {
      this.children.push(child);
      this.firstChild = this.children[0] || null;
      if (child.id) elementsById[child.id] = child;
    },
    insertBefore(child) {
      this.children.unshift(child);
      this.firstChild = child;
    },
    addEventListener() {},
    remove() {},
    set id(value) {
      this._id = value;
      elementsById[value] = this;
    },
    get id() {
      return this._id;
    }
  };
}

function createHarness(originalBody) {
  const messageListeners = [];
  const elementsById = {};
  const errors = [];
  const pageMessages = [];
  let fetchCallCount = 0;
  let xhrSendCount = 0;

  function FakeXHR() {
    this._listeners = {};
    this.readyState = 0;
    this.responseType = "";
    this.responseText = originalBody;
    this.response = originalBody;
  }

  FakeXHR.prototype.addEventListener = function (type, listener) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(listener);
  };
  FakeXHR.prototype.open = function (method, url) {
    this.responseURL = String(url);
  };
  FakeXHR.prototype.send = function () {
    xhrSendCount += 1;
    this.readyState = 4;
    (this._listeners.readystatechange || []).forEach(function (listener) {
      listener.call(this);
    }, this);
  };

  const documentElement = createElement(elementsById);
  const windowObject = {
    location: { href: "https://app.example.com/" },
    addEventListener(type, listener) {
      if (type === "message") messageListeners.push(listener);
    },
    postMessage(message) {
      pageMessages.push(message);
    },
    fetch() {
      fetchCallCount += 1;
      return Promise.resolve(new Response(originalBody, {
        status: 200,
        headers: { "content-type": "application/json" }
      }));
    }
  };

  const context = {
    window: windowObject,
    document: {
      body: null,
      documentElement: documentElement,
      getElementById(id) {
        return elementsById[id] || null;
      },
      createElement() {
        return createElement(elementsById);
      }
    },
    navigator: { language: "zh-CN" },
    XMLHttpRequest: FakeXHR,
    URL: URL,
    Response: Response,
    Headers: Headers,
    Promise: Promise,
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
    console: {
      error() {
        errors.push(Array.from(arguments));
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(injectedSource, context);

  return {
    errors: errors,
    FakeXHR: FakeXHR,
    window: windowObject,
    getFetchCallCount() {
      return fetchCallCount;
    },
    getXhrSendCount() {
      return xhrSendCount;
    },
    getPageMessages() {
      return pageMessages.slice();
    },
    setRules(rules) {
      messageListeners.forEach(function (listener) {
        listener({
          source: windowObject,
          data: {
            source: "response-rewriter-extension",
            type: "SET_RULES",
            rules: rules
          }
        });
      });
    },
    async fetchText(url, init) {
      const response = await windowObject.fetch(url, init);
      return response.text();
    }
  };
}

function createRule(overrides) {
  const rule = {
    id: "rule-1",
    enabled: true,
    name: "test rule",
    match: {
      method: "GET",
      urlMode: "exact",
      url: "/api/users/123"
    },
    rewrite: {
      mode: "replace",
      body: "rewritten"
    }
  };

  return Object.assign(rule, overrides);
}

test("legacy rules default to exact URL matching and whole-body replacement", async function () {
  const harness = createHarness("original");
  harness.setRules([{
    id: "legacy",
    enabled: true,
    name: "legacy",
    match: { method: "GET", url: "/api/users/123" },
    rewrite: { body: "legacy result" }
  }]);

  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123?tab=profile"),
    "legacy result"
  );
  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/1234"),
    "original"
  );
});

test("mock-fetch returns directly without calling the native fetch", async function () {
  const harness = createHarness("server response");
  harness.setRules([createRule({
    rewrite: {
      mode: "mock-fetch",
      body: "{\"source\":\"local\"}"
    }
  })]);

  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123"),
    "{\"source\":\"local\"}"
  );
  assert.equal(harness.getFetchCallCount(), 0);

  const hit = harness.getPageMessages().find(function (message) {
    return message && message.type === "RULE_HIT";
  });
  assert.equal(hit.outcome, "mock-fetch");
  assert.equal(hit.originalResponse, "");
  assert.equal(hit.rewrittenResponse, "{\"source\":\"local\"}");
});

test("contains matching checks the URL without query parameters", async function () {
  const harness = createHarness("original");
  harness.setRules([createRule({
    match: { method: "GET", urlMode: "contains", url: "/users/" }
  })]);

  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123?tab=profile"),
    "rewritten"
  );

  harness.setRules([createRule({
    match: { method: "GET", urlMode: "contains", url: "tab=profile" }
  })]);
  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123?tab=profile"),
    "original"
  );
});

test("regular expressions support anchored dynamic paths and fail closed when invalid", async function () {
  const harness = createHarness("original");
  harness.setRules([createRule({
    match: { method: "GET", urlMode: "regex", url: "/users/\\d+$" }
  })]);

  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123?tab=profile"),
    "rewritten"
  );

  harness.setRules([createRule({
    match: { method: "GET", urlMode: "regex", url: "[" }
  })]);
  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123"),
    "original"
  );
});

test("JSON merge recursively merges objects and replaces arrays", async function () {
  const harness = createHarness(JSON.stringify({
    user: { name: "Ada", role: "user" },
    items: [1, 2],
    active: true
  }));
  harness.setRules([createRule({
    rewrite: {
      mode: "json-merge",
      body: JSON.stringify({
        user: { role: "admin" },
        items: [9]
      })
    }
  })]);

  assert.deepEqual(
    JSON.parse(await harness.fetchText("https://api.example.com/api/users/123")),
    {
      user: { name: "Ada", role: "admin" },
      items: [9],
      active: true
    }
  );
});

test("JSON merge keeps the original response when either side is not an object", async function () {
  const arrayResponseHarness = createHarness("[1,2]");
  arrayResponseHarness.setRules([createRule({
    rewrite: {
      mode: "json-merge",
      body: JSON.stringify({ role: "admin" })
    }
  })]);

  assert.equal(
    await arrayResponseHarness.fetchText("https://api.example.com/api/users/123"),
    "[1,2]"
  );

  const arrayPatchHarness = createHarness(JSON.stringify({ role: "user" }));
  arrayPatchHarness.setRules([createRule({
    rewrite: {
      mode: "json-merge",
      body: "[1,2]"
    }
  })]);

  assert.equal(
    await arrayPatchHarness.fetchText("https://api.example.com/api/users/123"),
    JSON.stringify({ role: "user" })
  );
});

test("JavaScript transforms receive the original response and request context", async function () {
  const harness = createHarness(JSON.stringify({ name: "Ada" }));
  harness.setRules([createRule({
    rewrite: {
      mode: "script",
      body: [
        "const data = JSON.parse(originalResponse);",
        "data.method = context.method;",
        "data.url = context.url;",
        "data.resourceType = context.resourceType;",
        "return data;"
      ].join("\n")
    }
  })]);

  assert.deepEqual(
    JSON.parse(await harness.fetchText("https://api.example.com/api/users/123")),
    {
      name: "Ada",
      method: "GET",
      url: "https://api.example.com/api/users/123",
      resourceType: "fetch"
    }
  );
});

test("JavaScript transform errors keep the original response", async function () {
  const harness = createHarness(JSON.stringify({ name: "Ada" }));
  harness.setRules([createRule({
    rewrite: {
      mode: "script",
      body: "throw new Error('expected failure');"
    }
  })]);

  assert.equal(
    await harness.fetchText("https://api.example.com/api/users/123"),
    JSON.stringify({ name: "Ada" })
  );
  assert.equal(harness.errors.length, 1);
});

test("XHR uses the same matching and transformation behavior", function () {
  const harness = createHarness(JSON.stringify({
    profile: { name: "Ada", role: "user" }
  }));
  harness.setRules([createRule({
    match: { method: "GET", urlMode: "contains", url: "/users/" },
    rewrite: {
      mode: "json-merge",
      body: JSON.stringify({ profile: { role: "admin" } })
    }
  })]);

  const xhr = new harness.FakeXHR();
  xhr.open("GET", "https://api.example.com/api/users/123?tab=profile");
  xhr.send();

  assert.deepEqual(JSON.parse(xhr.responseText), {
    profile: { name: "Ada", role: "admin" }
  });
  assert.equal(xhr.response, xhr.responseText);
});

test("mock-fetch lets XHR reach the server and records a passthrough warning", function () {
  const harness = createHarness("server response");
  harness.setRules([createRule({
    rewrite: {
      mode: "mock-fetch",
      body: "fetch-only response"
    }
  })]);

  const xhr = new harness.FakeXHR();
  xhr.open("GET", "https://api.example.com/api/users/123");
  xhr.send();

  assert.equal(harness.getXhrSendCount(), 1);
  assert.equal(xhr.responseText, "server response");

  const hit = harness.getPageMessages().find(function (message) {
    return message && message.type === "RULE_HIT";
  });
  assert.equal(hit.outcome, "xhr-passthrough");
  assert.equal(hit.originalResponse, "server response");
  assert.equal(hit.rewrittenResponse, "server response");
});
