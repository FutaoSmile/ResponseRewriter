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

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map(function (value) {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
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

test("new management and accessibility copy is localized in every supported language", function () {
  const context = createUiContext();
  const keys = [
    "managerTitle",
    "exampleLog",
    "interceptionHelp",
    "interceptionOn",
    "interceptionOff",
    "interceptionHint",
    "globalScopeHint",
    "ruleOrderHint",
    "ruleCrossPageHint",
    "ruleSearchPlaceholder",
    "clearFilters",
    "dragRule",
    "dragUnavailable",
    "ruleMoved",
    "editRuleNamed",
    "duplicateRuleNamed",
    "deleteRuleNamedAction",
    "importPreviewMessage",
    "discardChangesConfirm",
    "logOutcomeRewriteFailed",
    "logTruncatedNotice",
    "dismiss"
  ];
  const translations = JSON.parse(vm.runInContext(`
    JSON.stringify(["zh-CN", "en", "ja", "ko"].flatMap(function (locale) {
      currentLocale = locale;
      return ${JSON.stringify(keys)}.map(function (key) {
        return [key, t(key, { name: "Rule", count: 1, conflicts: 0, position: 1, limit: 20000, originalLength: 1, rewrittenLength: 1 })];
      });
    }))
  `, context));

  translations.forEach(function (entry) {
    assert.notEqual(entry[1], entry[0]);
    assert.notEqual(entry[1].trim(), "");
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
  assert.match(popupSource, /saveState\(resetRules, resetLogs, t\("statsCleared"\)/);
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
  assert.match(popupSource, /showConfirmDialog[\s\S]*showModal\(elements\.deleteModal, elements\.cancelDeleteButton\)/);
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

test("rule action column is content-driven in every locale", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(styles, /--rule-actions-width:\s*minmax\(104px,\s*max-content\);/);
  assert.doesNotMatch(styles, /html:lang\([^)]*\)[^{]*\{[^{}]*--rule-actions-width/);
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

test("rule names stay inside their grid column without overlapping the method", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(styles, /\.manager-rules \.rule-item > \*\s*\{\s*min-width:\s*0;/);
  assert.match(styles, /\.rule-title-value\s*\{[^{}]*display:\s*flex;[^{}]*width:\s*100%;[^{}]*min-width:\s*0;/);
  assert.match(styles, /\.rule-title-value > span:last-child\s*\{[^{}]*overflow:\s*hidden;[^{}]*text-overflow:\s*ellipsis;/);
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

test("log clear action belongs to the log header instead of the filters", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");
  const logHeader = managerSource.match(/<div class="panel-bar manager-log-header">([\s\S]*?)<\/div>\s*<div class="log-filter-bar">/);
  const filterBar = managerSource.match(/<div class="log-filter-bar">([\s\S]*?)<\/div>/);

  assert.ok(logHeader);
  assert.ok(filterBar);
  assert.match(logHeader[1], /id="clearLogsButton"[^>]*data-i18n="clearLogsTitle"/);
  assert.match(filterBar[1], /id="logTypeFilter"/);
  assert.doesNotMatch(filterBar[1], /id="clearLogsButton"/);
  assert.match(styles, /\.panel-bar\.manager-log-header\s*\{[^{}]*flex-direction:\s*row;[^{}]*flex-wrap:\s*nowrap;/);
  assert.match(styles, /\.manager-log-header #clearLogsButton\s*\{[^{}]*flex:\s*0 0 auto;[^{}]*white-space:\s*nowrap;/);
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

test("manager exposes rule ordering, filters, and global pause without site scope", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const ruleModelSource = fs.readFileSync(path.join(uiDirectory, "rule-model.js"), "utf8");

  [
    "interceptionEnabled",
    "ruleSearchInput",
    "ruleStatusFilter",
    "ruleModeFilter",
    "clearRuleFiltersButton"
  ].forEach(function (id) {
    assert.match(managerSource, new RegExp('id="' + id + '"'));
  });
  assert.match(managerSource, /\.\.\/default-data\.js[\s\S]*i18n\.js[\s\S]*vendor\/sortable\.min\.js[\s\S]*popup\.js/);
  assert.match(managerSource, /id="ruleSortHelp"[\s\S]*<kbd>Alt<\/kbd>[\s\S]*<kbd>↑<\/kbd>[\s\S]*<kbd>↓<\/kbd>/);
  assert.match(popupSource, /Sortable\.create\(elements\.ruleList/);
  assert.match(popupSource, /class="drag-handle" data-drag-handle/);
  assert.match(popupSource, /event\.altKey[\s\S]*"ArrowUp"[\s\S]*"ArrowDown"/);
  assert.doesNotMatch(popupSource, /renderRuleAction\("move-(?:up|down)"/);
  assert.match(popupSource, /function getFilteredRules\(/);
  assert.doesNotMatch(managerSource, /id="ruleDomain"/);
  assert.doesNotMatch(ruleModelSource, /\bdomain:\s*/);
});

test("example logs stay visible without inflating real rule hit counts", function () {
  const context = createUiContext();
  const count = vm.runInContext(
    'getRuleLogs([{ ruleId: "one", isExample: true }, { ruleId: "one" }], "one").length',
    context
  );
  const badge = vm.runInContext(
    'renderExampleLogBadge({ isExample: true })',
    context
  );

  assert.equal(count, 1);
  assert.match(badge, /示例日志/);
});

test("drag sorting is bundled locally with its license", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const sortableSource = fs.readFileSync(path.join(uiDirectory, "vendor", "sortable.min.js"), "utf8");
  const sortableLicense = fs.readFileSync(path.join(uiDirectory, "vendor", "SORTABLE-LICENSE.txt"), "utf8");

  assert.match(managerSource, /src="vendor\/sortable\.min\.js"/);
  assert.match(sortableSource, /Sortable/);
  assert.match(sortableLicense, /MIT License/);
});

test("keyboard sorting keeps the moved rule visibly selected", function () {
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(popupSource, /ruleMoved[\s\S]*position:\s*targetVisibleIndex \+ 1/);
  assert.match(popupSource, /focusRuleDragHandle\(ruleId\)/);
  assert.match(
    styles,
    /\.manager-rules \.rule-item:has\(\.drag-handle:focus-visible\)\s*\{[^{}]*background:\s*var\(--brand-50\);[^{}]*box-shadow:\s*inset 0 0 0 2px/
  );
});

test("dynamic list interactions use native controls with accessible names", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const logViewSource = fs.readFileSync(path.join(uiDirectory, "log-view.js"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(managerSource, /id="uiTooltip" class="ui-tooltip" role="tooltip" hidden/);
  assert.match(popupSource, /<button type="button" class="badge hit-badge/);
  assert.match(popupSource, /aria-label="' \+ escapeHtml\(t\("toggleRule"/);
  assert.match(popupSource, /showTooltip\(target, 40\)/);
  assert.match(popupSource, /showTooltip\(target, 0\)/);
  assert.match(popupSource, /data-tooltip="' \+ escapeHtml\(label\)/);
  assert.doesNotMatch(popupSource, /data-action="' \+ action[\s\S]{0,160}title="/);
  assert.match(popupSource, /<button type="button" class="hit-summary" aria-expanded="false"/);
  assert.match(logViewSource, /card = document\.createElement\("button"\)/);
  assert.match(styles, /\.switch input:focus-visible \+ \.switch-slider/);
});

test("all modals expose dialog semantics and the topmost modal owns Escape", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");

  assert.equal((managerSource.match(/role="dialog" aria-modal="true"/g) || []).length, 3);
  assert.equal((managerSource.match(/role="alertdialog" aria-modal="true"/g) || []).length, 1);
  assert.match(popupSource, /function getTopOpenModal\(\)/);
  assert.match(popupSource, /if \(topModal === elements\.deleteModal\) closeDeleteModal\(\)/);
  assert.match(popupSource, /event\.key === "Tab"[\s\S]*getFocusableElements\(topModal\)/);
  assert.match(popupSource, /discard-rule/);
  assert.match(popupSource, /getRuleFormSnapshot\(\) === ruleModalSnapshot/);
});

test("field validation is inline and global feedback remains available to assistive technology", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(managerSource, /id="status" role="status" aria-live="polite"/);
  assert.match(managerSource, /id="ruleNameError" class="field-error"/);
  assert.match(managerSource, /id="urlMatchError" class="field-error"/);
  assert.match(managerSource, /id="rewriteBodyError" class="field-error"/);
  assert.match(popupSource, /function showFieldError\(/);
  assert.match(popupSource, /input\.setAttribute\("aria-invalid", "true"\)/);
  assert.match(popupSource, /toast\.setAttribute\("role", type === "error" \? "alert" : "status"\)/);
  assert.doesNotMatch(styles, /\.app-manager #status\s*\{\s*display:\s*none/);
});

test("responsive rules preserve labels and mobile targets", function () {
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(popupSource, /data-label="' \+ escapeHtml\(t\("method"\)\)/);
  assert.match(styles, /\.manager-rules \.rule-item > span::before\s*\{[^{}]*content:\s*attr\(data-label\)/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*min-height:\s*44px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("manager workspace gives the rule list more room on wide screens", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");

  assert.match(styles, /\.app\s*\{[^{}]*width:\s*min\(1440px,\s*calc\(100vw - 40px\)\);/);
  assert.match(styles, /\.app-manager\s*\{[^{}]*max-width:\s*1440px;/);
  assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*clamp\(320px,\s*28vw,\s*400px\);/);
});

test("import preview, failure logs, and retention limits are visible", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");
  const logViewSource = fs.readFileSync(path.join(uiDirectory, "log-view.js"), "utf8");
  const contentSource = fs.readFileSync(path.join(__dirname, "..", "src", "content.js"), "utf8");

  assert.match(popupSource, /confirmAction = "import-rules"/);
  assert.match(popupSource, /importPreviewMessage/);
  assert.match(logViewSource, /logOutcomeRewriteFailed/);
  assert.match(logViewSource, /renderTruncationNotice/);
  assert.match(contentSource, /originalResponseTruncated:/);
  assert.match(contentSource, /rewrittenResponseTruncated:/);
  assert.match(managerSource, /data-i18n="logRetentionHint"/);
});

test("obsolete popup page and inline HTML styles are removed", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");

  assert.equal(fs.existsSync(path.join(uiDirectory, "popup.html")), false);
  assert.doesNotMatch(managerSource, /\sstyle="/);
});

test("light-theme muted and semantic text tokens meet WCAG AA contrast", function () {
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");
  function token(name) {
    const match = styles.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6});"));
    assert.ok(match, "missing token " + name);
    return match[1];
  }

  assert.ok(contrastRatio(token("text-muted"), token("bg")) >= 4.5);
  assert.ok(contrastRatio(token("text-muted"), token("surface")) >= 4.5);
  assert.ok(contrastRatio(token("success-text"), token("success-50")) >= 4.5);
  assert.ok(contrastRatio(token("danger-text"), token("danger-50")) >= 4.5);
});

test("global interception control explains its impact without changing header density", function () {
  const managerSource = fs.readFileSync(path.join(uiDirectory, "manager.html"), "utf8");
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");
  const popupSource = fs.readFileSync(path.join(uiDirectory, "popup.js"), "utf8");

  assert.match(managerSource, /class="header-help-button"[^>]*data-i18n-tooltip="interceptionHint"/);
  assert.match(managerSource, /id="interceptionHint" class="visually-hidden"[^>]*data-i18n="interceptionHint"/);
  assert.match(managerSource, /id="interceptionEnabled"[^>]*aria-describedby="interceptionHint"/);
  assert.match(styles, /\.header-interception-control\s*\{[^{}]*min-height:\s*var\(--compact-control-height\);[^{}]*border-radius:\s*var\(--radius-sm\);/);
  assert.doesNotMatch(styles, /\.header-interception\s*\{[^{}]*min-height:\s*58px;/);
  assert.doesNotMatch(styles, /\.header-interception\s*\{[^{}]*background:/);
  assert.match(popupSource, /querySelectorAll\("\[data-i18n-tooltip\]"\)[\s\S]*node\.dataset\.tooltip = t/);
  assert.ok(contrastRatio("#ffffff", "#4338ca") >= 4.5);
});

test("rule model keeps backward-compatible defaults after extraction", function () {
  const context = createUiContext();
  const rule = JSON.parse(vm.runInContext(
    'JSON.stringify(normalizeRule({ name: "legacy", match: { url: "/api" }, rewrite: { body: "{}" } }, 0))',
    context
  ));

  assert.equal(rule.match.urlMode, "exact");
  assert.equal(rule.rewrite.mode, "replace");
  assert.equal(Object.hasOwn(rule.match, "domain"), false);
});

test("drag sorting reorders visible rules without disturbing filtered-out positions", function () {
  const context = createUiContext();
  const result = JSON.parse(vm.runInContext(`
    (function () {
      var allRules = ["a", "hidden-1", "b", "hidden-2", "c"].map(function (id) { return { id: id }; });
      var visibleRules = [allRules[0], allRules[2], allRules[4]];
      return JSON.stringify(reorderRulesByVisiblePositions(allRules, visibleRules, 2, 0).map(function (rule) {
        return rule.id;
      }));
    })()
  `, context));

  assert.deepEqual(result, ["c", "hidden-1", "a", "hidden-2", "b"]);
});

test("rule validation identifies the field that needs correction", function () {
  const context = createUiContext();
  const result = JSON.parse(vm.runInContext(`
    (function () {
      try {
        validateRule({
          name: "Invalid regex",
          match: { method: "GET", urlMode: "regex", url: "[" },
          rewrite: { mode: "replace", body: "{}" }
        });
        return null;
      } catch (error) {
        return JSON.stringify({ field: error.field, message: error.message });
      }
    })()
  `, context));

  assert.equal(result.field, "urlMatchValue");
  assert.notEqual(result.message, "invalidRegex");
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

test("log detail notices flatten nested outcome badges", function () {
  const context = createUiContext();
  const styles = fs.readFileSync(path.join(uiDirectory, "popup.css"), "utf8");
  const html = vm.runInContext(
    'renderLogDetailHTML("", "{\\"ok\\":true}", "mock-fetch")',
    context
  );

  assert.match(html, /log-outcome-notice is-success/);
  assert.match(html, /Fetch 已拦截 · 未发送服务器/);
  assert.match(
    styles,
    /\.log-outcome-notice > \.log-outcome-badge\s*\{[^{}]*padding:\s*0;[^{}]*border:\s*0;[^{}]*background:\s*transparent;/
  );
  assert.match(styles, /\.log-outcome-notice > \.log-outcome-badge::before\s*\{[^{}]*background:\s*currentColor;/);
});

test("failed and truncated rewrites render explicit localized detail", function () {
  const context = createUiContext();
  const html = vm.runInContext(`
    renderLogDetailHTML("before", "before", "rewrite-failed", {
      outcome: "rewrite-failed",
      errorMessage: "<unsafe failure>",
      originalResponseTruncated: true,
      rewrittenResponseTruncated: false,
      originalResponseLength: 25000,
      rewrittenResponseLength: 6
    })
  `, context);

  assert.match(html, /log-outcome-notice is-error/);
  assert.match(html, /处理失败/);
  assert.match(html, /&lt;unsafe failure&gt;/);
  assert.match(html, /响应内容已截断/);
  assert.doesNotMatch(html, /<unsafe failure>/);
});
