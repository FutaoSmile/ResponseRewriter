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

test("every URL and response mode has localized guidance and an example", function () {
  const context = createUiContext();
  const guides = JSON.parse(vm.runInContext(`
    JSON.stringify(["zh-CN", "en", "ja", "ko"].flatMap(function (locale) {
      currentLocale = locale;
      return [
        getUrlModeGuide("exact"),
        getUrlModeGuide("contains"),
        getUrlModeGuide("regex"),
        getRewriteModeGuide("replace"),
        getRewriteModeGuide("json-merge"),
        getRewriteModeGuide("script"),
        getRewriteModeGuide("mock-fetch")
      ];
    }))
  `, context));

  assert.equal(guides.length, 28);
  guides.forEach(function (guide) {
    assert.equal(typeof guide.hint, "string");
    assert.notEqual(guide.hint.trim(), "");
    assert.doesNotMatch(guide.hint, /^(urlHint|rewriteHint)/);
    assert.equal(typeof guide.example, "string");
    assert.notEqual(guide.example.trim(), "");
    assert.doesNotMatch(guide.example, /^(urlExample|rewriteExample)/);
  });
});

test("mock-fetch guidance warns that the request is absent from DevTools Network", function () {
  const context = createUiContext();
  const hints = JSON.parse(vm.runInContext(`
    JSON.stringify(["zh-CN", "en", "ja", "ko"].map(function (locale) {
      currentLocale = locale;
      return getRewriteModeGuide("mock-fetch").hint;
    }))
  `, context));

  hints.forEach(function (hint) {
    assert.match(hint, /Network/);
  });
});

test("clearing hit records deletes the matching logs and uses the localized confirmation", function () {
  const context = createUiContext();
  const copy = JSON.parse(vm.runInContext(`
    JSON.stringify(["zh-CN", "en", "ja", "ko"].map(function (locale) {
      currentLocale = locale;
      return [t("clearStatsConfirm"), t("clearStatsNote")];
    }))
  `, context));
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");

  copy.flat().forEach(function (message) {
    assert.notEqual(message.trim(), "");
    assert.doesNotMatch(message, /^(clearStatsConfirm|clearStatsNote)$/);
  });
  assert.match(popupSource, /resetHitsStatsButton[\s\S]*openResetHitsConfirm\(\)/);
  assert.match(popupSource, /confirmAction === "reset-hit-stats"[\s\S]*log\.ruleId !== hitsModalRuleId[\s\S]*createEmptyStats\(\)/);
  assert.match(popupSource, /chrome\.storage\.local\.set\(\{ rules: rules, logs: logs \}/);
  assert.doesNotMatch(popupSource, /window\.confirm\(t\("clearStatsConfirm"\)\)/);
});

test("destructive confirmations use a consistent warning dialog and localized actions", function () {
  const context = createUiContext();
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const keys = [
    "deleteRuleNote",
    "confirmDelete",
    "clearStatsNote",
    "clearLogsNote",
    "confirmClearLogs"
  ];
  const copy = JSON.parse(vm.runInContext(`
    JSON.stringify(["zh-CN", "en", "ja", "ko"].flatMap(function (locale) {
      currentLocale = locale;
      return ${JSON.stringify(keys)}.map(function (key) {
        return [key, t(key)];
      });
    }))
  `, context));

  assert.match(managerSource, /class="[^"]*confirm-dialog[^"]*" role="alertdialog"/);
  assert.match(managerSource, /class="confirm-dialog-warning"[\s\S]*<svg[\s\S]*id="confirmModalNote"/);
  assert.match(popupSource, /function setConfirmDialogContent\(/);
  assert.match(popupSource, /"clearLogsNote"[\s\S]*"confirmClearLogs"/);
  assert.match(popupSource, /showConfirmDialog[\s\S]*cancelDeleteButton\.focus\(\)/);
  copy.forEach(function (entry) {
    assert.notEqual(entry[1], entry[0]);
    assert.notEqual(entry[1].trim(), "");
  });
});

test("rule hit counts use the currently retained logs", function () {
  const context = createUiContext();
  const count = vm.runInContext(`
    getRuleLogs([
      { ruleId: "rule-a" },
      { ruleId: "rule-b" },
      { ruleId: "rule-a" }
    ], "rule-a").length
  `, context);
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");

  assert.equal(count, 2);
  assert.match(popupSource, /var hitCount = getRuleLogs\(logs, rule\.id\)\.length/);
  assert.match(popupSource, /if \(changes\.logs\)[\s\S]*renderRuleList\(\)/);
});

test("rule form renders guidance targets for both mode selectors", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");

  [
    "urlMatchModeHint",
    "urlMatchModeExample",
    "rewriteModeHint",
    "rewriteModeExample"
  ].forEach(function (id) {
    assert.match(managerSource, new RegExp('id="' + id + '"'));
  });
});

test("rule form layout flows naturally without redundant section titles", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");

  assert.match(managerSource, /id="ruleName"[\s\S]*id="matchMethod"[\s\S]*id="ruleEnabled"/);
  assert.match(managerSource, /id="urlMatchMode"[\s\S]*id="urlMatchValue"[\s\S]*id="urlMatchModeHint"/);
  assert.match(managerSource, /id="rewriteMode"[\s\S]*id="rewriteBody"[\s\S]*id="saveButton"/);
  assert.doesNotMatch(managerSource, /rule-form-section-title/);
});

test("rule enabled switch aligns with adjacent form controls in compact layout", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(managerSource, /class="field field-switch"[\s\S]*id="ruleEnabled"/);
  assert.match(styles, /\.field-switch\s*\{[^{}]*justify-content:\s*flex-end;/);
});

test("rule action column adapts to expanded English button labels", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(styles, /--rule-actions-width:\s*140px;/);
  assert.match(styles, /html:lang\(en\)\s*\{[^{}]*--rule-actions-width:\s*188px;/);
  assert.equal((styles.match(/grid-template-columns:[^;]*var\(--rule-actions-width\);/g) || []).length, 2);
  assert.match(styles, /\.table-action\s*\{[^{}]*white-space:\s*nowrap;/);
});

test("localized rule table headings stay on one line", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(
    styles,
    /\.manager-rules \.list-head > span\s*\{\s*white-space:\s*nowrap;\s*\}/
  );
});

test("manager list controls use compact sizing without shrinking their labels", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.doesNotMatch(managerSource, /clearLogsButton[^>]*font-size:/);
  assert.match(styles, /--compact-control-height:\s*34px;/);
  assert.match(styles, /\.header-select select\s*\{[^{}]*min-height:\s*var\(--compact-control-height\);/);
  assert.match(styles, /\.app-manager \.log-filter-bar input,[\s\S]*?min-height:\s*var\(--compact-control-height\);/);
  assert.match(styles, /\.app-manager \.panel-actions button,[\s\S]*?min-height:\s*32px;/);
});

test("select focus styles preserve the custom dropdown arrow", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");
  const focusBlocks = Array.from(styles.matchAll(/([^{}]*select:focus[^{}]*)\{([^{}]*)\}/g));

  assert.notEqual(focusBlocks.length, 0);
  focusBlocks.forEach(function (match) {
    assert.doesNotMatch(match[2], /(^|;)\s*background\s*:/);
  });
  assert.match(styles, /select:focus\s*\{[^{}]*background-image:/);
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

test("response diff formats JSON and aligns changed lines", function () {
  const context = createUiContext();
  const diff = JSON.parse(vm.runInContext(`
    JSON.stringify(createLineDiff(
      '{"name":"Alice","role":"user"}',
      '{\\n  "name": "Alice",\\n  "role": "admin",\\n  "active": true\\n}'
    ))
  `, context));

  assert.equal(diff.removedCount, 1);
  assert.equal(diff.addedCount, 2);
  assert.ok(diff.rows.some(function (row) {
    return row.original && row.original.includes('"user"') &&
      row.rewritten && row.rewritten.includes('"admin"');
  }));
  assert.ok(diff.rows.some(function (row) {
    return row.original === null && row.rewritten && row.rewritten.includes('"active"');
  }));
});

test("response diff ignores JSON formatting-only changes", function () {
  const context = createUiContext();
  const diff = JSON.parse(vm.runInContext(`
    JSON.stringify(createLineDiff(
      '{"ok":true,"items":[]}',
      '{\\n  "ok": true,\\n  "items": []\\n}'
    ))
  `, context));

  assert.equal(diff.removedCount, 0);
  assert.equal(diff.addedCount, 0);
  assert.ok(diff.rows.every(function (row) {
    return row.changed === false;
  }));
});

test("response diff renderer escapes response text", function () {
  const context = createUiContext();
  const html = vm.runInContext(
    'renderLogDetailHTML("<script>alert(1)</script>", "<script>alert(2)</script>")',
    context
  );

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /diff-cell is-removed/);
  assert.match(html, /diff-cell is-added/);
});

test("XHR passthrough logs render a prominent localized warning", function () {
  const context = createUiContext();
  const html = vm.runInContext(
    'renderLogDetailHTML("server", "server", "xhr-passthrough")',
    context
  );

  assert.match(html, /log-outcome-notice is-warning/);
  assert.match(html, /XHR 未拦截/);
  assert.match(html, /已正常发送至服务器/);
});
