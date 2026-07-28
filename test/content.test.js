const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const contentSource = fs.readFileSync(path.join(__dirname, "..", "src", "content.js"), "utf8");
const testChannel = "11111111-1111-4111-8111-111111111111";

function normalizeRules(rules) {
  let rulesSnapshot;
  const listeners = {};
  function FakeCustomEvent(type, options) {
    this.type = type;
    this.detail = options && options.detail;
  }
  const windowObject = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    dispatchEvent(event) {
      if (event.type === "response-rewriter:bootstrap-request") {
        listeners["response-rewriter:bootstrap-response"](new FakeCustomEvent(
          "response-rewriter:bootstrap-response",
          { detail: testChannel }
        ));
      }
      if (event.type.endsWith(":rules")) {
        rulesSnapshot = JSON.parse(event.detail);
      }
    }
  };
  const appendTarget = {
    appendChild(script) {
      script.onload();
    }
  };
  const context = {
    window: windowObject,
    CustomEvent: FakeCustomEvent,
    document: {
      documentElement: appendTarget,
      head: null,
      body: null,
      createElement() {
        return {
          remove() {}
        };
      }
    },
    chrome: {
      runtime: {
        getURL(value) {
          return value;
        }
      },
      storage: {
        local: {
          get(defaults, callback) {
            callback({
              rules: rules,
              interceptionEnabled: true,
              privacyConsentVersion: 1
            });
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(contentSource, context);
  return rulesSnapshot.rules;
}

function recordHit(hit, existingLogs) {
  let savedValue = null;
  const listeners = {};
  function FakeCustomEvent(type, options) {
    this.type = type;
    this.detail = options && options.detail;
  }
  const appendTarget = {
    appendChild(script) {
      script.onload();
    }
  };
  const storedRule = {
    id: hit.ruleId,
    enabled: true,
    name: "test rule",
    match: { method: "GET", urlMode: "exact", url: "/api" },
    rewrite: { mode: "replace", body: "{}" },
    stats: {}
  };
  const windowObject = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    dispatchEvent() {
      const event = arguments[0];
      if (event.type === "response-rewriter:bootstrap-request") {
        listeners["response-rewriter:bootstrap-response"](new FakeCustomEvent(
          "response-rewriter:bootstrap-response",
          { detail: testChannel }
        ));
      }
      return true;
    }
  };
  const context = {
    window: windowObject,
    CustomEvent: FakeCustomEvent,
    document: {
      documentElement: appendTarget,
      head: null,
      body: null,
      createElement() {
        return { remove() {} };
      }
    },
    chrome: {
      runtime: {
        getURL(value) {
          return value;
        },
        sendMessage() {}
      },
      storage: {
        local: {
          get(defaults, callback) {
            callback({
              rules: [storedRule],
              logs: existingLogs || [],
              interceptionEnabled: true,
              privacyConsentVersion: 1
            });
          },
          set(value) {
            savedValue = value;
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    },
    console: { error() {} }
  };

  vm.createContext(context);
  vm.runInContext(contentSource, context);
  listeners["response-rewriter:" + testChannel + ":hit"](new FakeCustomEvent(
    "response-rewriter:" + testChannel + ":hit",
    { detail: JSON.stringify(hit) }
  ));
  return savedValue;
}

test("old rules receive backward-compatible matching and rewrite defaults", function () {
  const normalized = normalizeRules([{
    id: "old-rule",
    enabled: true,
    name: "old rule",
    match: {
      method: "get",
      url: "/api/users"
    },
    rewrite: {
      body: "replacement"
    }
  }]);

  assert.equal(normalized[0].match.method, "GET");
  assert.equal(normalized[0].match.urlMode, "exact");
  assert.equal(normalized[0].rewrite.mode, "replace");
  assert.equal(normalized[0].rewrite.body, "replacement");
});

test("new URL and response modes survive normalization", function () {
  const normalized = normalizeRules([
    {
      id: "contains",
      match: { urlMode: "contains", url: "/api/", domain: "api.example.com" },
      rewrite: { mode: "json-merge", body: "{}" }
    },
    {
      id: "regex",
      match: { urlMode: "regex", url: "/users/\\d+$" },
      rewrite: { mode: "script", body: "return originalResponse;" }
    },
    {
      id: "mock-fetch",
      match: { urlMode: "exact", url: "/mock" },
      rewrite: { mode: "mock-fetch", body: "{}" }
    }
  ]);

  assert.equal(normalized[0].match.urlMode, "contains");
  assert.equal(Object.hasOwn(normalized[0].match, "domain"), false);
  assert.equal(normalized[0].rewrite.mode, "json-merge");
  assert.equal(normalized[1].match.urlMode, "regex");
  assert.equal(normalized[1].rewrite.mode, "script");
  assert.equal(normalized[2].rewrite.mode, "mock-fetch");
});

test("unknown modes fall back to safe defaults", function () {
  const normalized = normalizeRules([{
    id: "unknown",
    match: { urlMode: "wildcard", url: "/api/*" },
    rewrite: { mode: "template", body: "value" }
  }]);

  assert.equal(normalized[0].match.urlMode, "exact");
  assert.equal(normalized[0].rewrite.mode, "replace");
});

test("hit logs expose truncation metadata and retain only the latest 100 entries", function () {
  const existingLogs = Array.from({ length: 100 }, function (_, index) {
    return { id: "existing-" + index };
  });
  const longResponse = "x".repeat(20001);
  const saved = recordHit({
    ruleId: "rule-1",
    originalResponse: longResponse,
    rewrittenResponse: longResponse + "y",
    errorMessage: "expected failure",
    outcome: "rewrite-failed"
  }, existingLogs);

  assert.equal(saved.logs.length, 100);
  assert.equal(saved.logs[0].originalResponseTruncated, true);
  assert.equal(saved.logs[0].rewrittenResponseTruncated, true);
  assert.equal(saved.logs[0].originalResponseLength, 20001);
  assert.equal(saved.logs[0].rewrittenResponseLength, 20002);
  assert.equal(saved.logs[0].errorMessage, "expected failure");
  assert.match(saved.logs[0].originalResponse, /\[truncated\]$/);
});

test("rule data uses a per-frame event channel instead of public window messages", function () {
  assert.doesNotMatch(contentSource, /window\.postMessage|addEventListener\("message"/);
  assert.doesNotMatch(contentSource, /response-rewriter-(?:extension|page)/);
  assert.match(contentSource, /BOOTSTRAP_REQUEST_EVENT/);
  assert.match(contentSource, /new CustomEvent\(rulesEvent/);
});

test("the page interceptor stays unpatched before privacy consent", function () {
  let rulesSnapshot = null;
  const listeners = {};
  function FakeCustomEvent(type, options) {
    this.type = type;
    this.detail = options && options.detail;
  }
  const context = {
    window: {
      addEventListener(type, listener) {
        listeners[type] = listener;
      },
      dispatchEvent(event) {
        if (event.type === "response-rewriter:bootstrap-request") {
          listeners["response-rewriter:bootstrap-response"](new FakeCustomEvent(
            "response-rewriter:bootstrap-response",
            { detail: testChannel }
          ));
        } else if (event.type.endsWith(":rules")) {
          rulesSnapshot = JSON.parse(event.detail);
        }
      }
    },
    CustomEvent: FakeCustomEvent,
    document: {
      documentElement: {},
      head: null,
      body: null,
      createElement() { return {}; }
    },
    chrome: {
      runtime: {
        getURL(value) {
          return value;
        },
        sendMessage() {}
      },
      storage: {
        local: {
          get(defaults, callback) {
            callback({
              rules: [],
              interceptionEnabled: true,
              privacyConsentVersion: 0
            });
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    },
    console: { error() {} }
  };

  vm.createContext(context);
  vm.runInContext(contentSource, context);
  assert.deepEqual(rulesSnapshot.rules, []);
  assert.equal(rulesSnapshot.interceptionEnabled, false);
  assert.equal(rulesSnapshot.privacyConsentGranted, false);
});
