const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const uiDirectory = path.join(__dirname, "..", "src", "ui");
const moduleNames = ["i18n.js", "rule-model.js", "log-view.js"];

function createUiContext() {
  const context = vm.createContext({});
  moduleNames.forEach(function (name) {
    vm.runInContext(fs.readFileSync(path.join(uiDirectory, name), "utf8"), context);
    if (name === "i18n.js") {
      vm.runInContext("let currentLocale = DEFAULT_LOCALE;", context);
    }
  });
  return context;
}

test("UI modules load in page order and share localization helpers", function () {
  const context = createUiContext();

  assert.equal(vm.runInContext('t("newRule")', context), "新规则");
  assert.equal(vm.runInContext('normalizeLocale("en-US")', context), "en");
});

test("rule model keeps backward-compatible defaults after extraction", function () {
  const context = createUiContext();
  const rule = JSON.parse(vm.runInContext(
    'JSON.stringify(normalizeRule({ name: "legacy", match: { url: "/api" }, rewrite: { body: "{}" } }, 0))',
    context
  ));

  assert.equal(rule.match.urlMode, "exact");
  assert.equal(rule.rewrite.mode, "replace");
});

test("log view pagination remains reusable after extraction", function () {
  const context = createUiContext();
  const page = JSON.parse(vm.runInContext(
    "JSON.stringify(getPageItems([1, 2, 3, 4, 5], 2, 2))",
    context
  ));

  assert.deepEqual(page, {
    items: [3, 4],
    page: 2,
    totalPages: 3
  });
});
