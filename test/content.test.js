const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const contentSource = fs.readFileSync(path.join(__dirname, "..", "src", "content.js"), "utf8");

function normalizeRules(rules) {
  let postedMessage;
  const appendTarget = {
    appendChild() {}
  };
  const context = {
    window: {
      postMessage(data) {
        postedMessage = data;
      },
      addEventListener() {}
    },
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
            callback({ rules: rules });
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
  return postedMessage.rules;
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
      match: { urlMode: "contains", url: "/api/" },
      rewrite: { mode: "json-merge", body: "{}" }
    },
    {
      id: "regex",
      match: { urlMode: "regex", url: "/users/\\d+$" },
      rewrite: { mode: "script", body: "return originalResponse;" }
    }
  ]);

  assert.equal(normalized[0].match.urlMode, "contains");
  assert.equal(normalized[0].rewrite.mode, "json-merge");
  assert.equal(normalized[1].match.urlMode, "regex");
  assert.equal(normalized[1].rewrite.mode, "script");
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
