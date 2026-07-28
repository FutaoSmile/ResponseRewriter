const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "default-data.js"), "utf8");

function createDefaults() {
  const context = vm.createContext({});
  vm.runInContext(source, context);
  return context.ResponseRewriterDefaults;
}

test("default examples cover every supported matching and response mode", function () {
  const defaults = createDefaults();
  const rules = defaults.createRules();
  const sampleFile = JSON.parse(fs.readFileSync(
    path.join(__dirname, "..", "examples", "sample-rules.json"),
    "utf8"
  ));

  assert.deepEqual(
    Array.from(new Set(rules.map(function (rule) { return rule.match.urlMode; }))).sort(),
    ["contains", "exact", "regex"]
  );
  assert.deepEqual(
    Array.from(rules, function (rule) { return rule.rewrite.mode; }).sort(),
    ["json-merge", "mock-fetch", "replace", "script"]
  );
  assert.ok(rules.every(function (rule) { return rule.enabled === false; }));
  assert.ok(rules.every(function (rule) { return !Object.hasOwn(rule.match, "domain"); }));
  assert.deepEqual(
    sampleFile.map(function (rule) { return rule.id; }),
    Array.from(rules, function (rule) { return rule.id; })
  );
});

test("default logs are clearly marked examples and match the sample rules", function () {
  const defaults = createDefaults();
  const rules = defaults.createRules();
  const logs = defaults.createLogs();
  const ruleIds = new Set(rules.map(function (rule) { return rule.id; }));

  assert.equal(logs.length, rules.length);
  logs.forEach(function (log) {
    assert.equal(log.isExample, true);
    assert.ok(ruleIds.has(log.ruleId));
    assert.equal(log.originalResponseLength, log.originalResponse.length);
    assert.equal(log.rewrittenResponseLength, log.rewrittenResponse.length);
  });
});
