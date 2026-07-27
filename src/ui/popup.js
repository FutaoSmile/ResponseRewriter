const RULES_PAGE_SIZE = 10;
const LOGS_PAGE_SIZE = 10;
const DEFAULT_THEME = "light";
const THEME_STORAGE_KEY = "theme";
const elements = {
  ruleList: document.getElementById("ruleList"),
  logList: document.getElementById("logList"),
  rulePrevPageButton: document.getElementById("rulePrevPageButton"),
  ruleNextPageButton: document.getElementById("ruleNextPageButton"),
  rulePageInfo: document.getElementById("rulePageInfo"),
  logPrevPageButton: document.getElementById("logPrevPageButton"),
  logNextPageButton: document.getElementById("logNextPageButton"),
  logPageInfo: document.getElementById("logPageInfo"),
  addRuleButton: document.getElementById("addRuleButton"),
  importRulesButton: document.getElementById("importRulesButton"),
  exportRulesButton: document.getElementById("exportRulesButton"),
  importRulesFile: document.getElementById("importRulesFile"),
  status: document.getElementById("status"),
  ruleModal: document.getElementById("ruleModal"),
  ruleModalTitle: document.getElementById("ruleModalTitle"),
  closeRuleModalButton: document.getElementById("closeRuleModalButton"),
  deleteModal: document.getElementById("deleteModal"),
  closeDeleteModalButton: document.getElementById("closeDeleteModalButton"),
  cancelDeleteButton: document.getElementById("cancelDeleteButton"),
  confirmDeleteButton: document.getElementById("confirmDeleteButton"),
  confirmModalTitle: document.getElementById("confirmModalTitle"),
  confirmModalNote: document.getElementById("confirmModalNote"),
  deleteModalText: document.getElementById("deleteModalText"),
  logModal: document.getElementById("logModal"),
  closeLogModalButton: document.getElementById("closeLogModalButton"),
  logMetaText: document.getElementById("logMetaText"),
  ruleForm: document.getElementById("ruleForm"),
  ruleName: document.getElementById("ruleName"),
  ruleEnabled: document.getElementById("ruleEnabled"),
  matchMethod: document.getElementById("matchMethod"),
  urlMatchMode: document.getElementById("urlMatchMode"),
  urlMatchValue: document.getElementById("urlMatchValue"),
  urlMatchModeHint: document.getElementById("urlMatchModeHint"),
  urlMatchModeExample: document.getElementById("urlMatchModeExample"),
  rewriteMode: document.getElementById("rewriteMode"),
  rewriteModeHint: document.getElementById("rewriteModeHint"),
  rewriteModeExample: document.getElementById("rewriteModeExample"),
  responseBodyLabel: document.getElementById("responseBodyLabel"),
  rewriteBody: document.getElementById("rewriteBody"),
  formatRewriteBodyButton: document.getElementById("formatRewriteBodyButton"),
  ruleCount: document.getElementById("ruleCount"),
  toastContainer: document.getElementById("toastContainer"),
  hitsModal: document.getElementById("hitsModal"),
  hitsModalTitle: document.getElementById("hitsModalTitle"),
  hitsList: document.getElementById("hitsList"),
  closeHitsModalButton: document.getElementById("closeHitsModalButton"),
  resetHitsStatsButton: document.getElementById("resetHitsStatsButton"),
  loadExampleButton: document.getElementById("loadExampleButton"),
  clearLogsButton: document.getElementById("clearLogsButton"),
  logSearchInput: document.getElementById("logSearchInput"),
  logTypeFilter: document.getElementById("logTypeFilter"),
  localeSelect: document.getElementById("localeSelect"),
  themeSelect: document.getElementById("themeSelect")
};

let currentLocale = DEFAULT_LOCALE;
let currentTheme = DEFAULT_THEME;
let rules = [];
let editingRuleId = "";
let deleteRuleId = "";
let modalMode = "create";
let currentModalRule = null;
let logs = [];
let logFilters = {
  keyword: "",
  resourceType: ""
};
let rulePage = 1;
let logPage = 1;

/* ================================================================
   Utility helpers
   ================================================================ */

function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;

  if (elements.themeSelect) {
    elements.themeSelect.value = currentTheme;
  }
}

function applyLocale() {
  document.documentElement.lang = currentLocale;

  document.querySelectorAll("[data-i18n]").forEach(function (node) {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });

  var localeSelect = document.getElementById("localeSelect");
  if (localeSelect) {
    localeSelect.value = currentLocale;
  }

  updateUrlMatchModeUi();
  updateRewriteModeUi();
  renderRuleList();
  renderLogList();
}

function downloadTextFile(filename, text) {
  var blob = new Blob([text], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 0);
}

function exportRules() {
  var filename = "response-rewriter-rules-" + new Date().toISOString().slice(0, 10) + ".json";
  downloadTextFile(filename, JSON.stringify(getExportRulesPayload(), null, 2));
  setStatus(t("exportRulesSuccess"));
}

function importRulesFromFile(file) {
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(String(reader.result || ""));
      var imported = normalizeRules(getImportRulesPayload(parsed));
      if (!imported.length) {
        throw new Error(t("importRulesEmpty"));
      }

      var existingIds = new Set(rules.map(function (rule) { return rule.id; }));
      var nextRules = imported.map(function (rule) {
        return resetRuleIdentity(rule, existingIds);
      });
      rules = nextRules.concat(rules);
      rulePage = 1;
      saveRules(t("importRulesSuccess", { count: nextRules.length }));
    } catch (error) {
      setStatus(t("importRulesFailed", { message: error.message }), true);
    } finally {
      if (elements.importRulesFile) {
        elements.importRulesFile.value = "";
      }
    }
  };
  reader.onerror = function () {
    setStatus(t("importRulesFailed", { message: reader.error ? reader.error.message : "unknown" }), true);
    if (elements.importRulesFile) {
      elements.importRulesFile.value = "";
    }
  };
  reader.readAsText(file);
}

function duplicateRule(rule) {
  var existingIds = new Set(rules.map(function (item) { return item.id; }));
  var duplicated = resetRuleIdentity(rule, existingIds, "(" + t("copySuffix") + ")");
  var index = rules.findIndex(function (item) {
    return item.id === rule.id;
  });
  if (index === -1) {
    rules.unshift(duplicated);
    rulePage = 1;
  } else {
    rules.splice(index + 1, 0, duplicated);
    rulePage = Math.floor((index + 1) / RULES_PAGE_SIZE) + 1;
  }
  saveRules(t("duplicatedRule"));
}

/* ================================================================
   Toast notification system
   ================================================================ */

function showToast(message, type) {
  type = type || "";
  if (!elements.toastContainer) return;

  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(function () {
    toast.classList.add("removing");
    toast.addEventListener("animationend", function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 2200);
}

/* ================================================================
   Ripple effect
   ================================================================ */

function addRipple(event) {
  var button = event.currentTarget;
  var rect = button.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var x = event.clientX - rect.left - size / 2;
  var y = event.clientY - rect.top - size / 2;

  var ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = size + "px";
  ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";
  button.appendChild(ripple);

  ripple.addEventListener("animationend", function () {
    if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
  });
}

function attachRippleToButtons() {
  document.querySelectorAll("button").forEach(function (btn) {
    if (!btn.dataset.rippleAttached) {
      btn.dataset.rippleAttached = "1";
      btn.addEventListener("click", addRipple);
    }
  });
}

/* ================================================================
   Status bar
   ================================================================ */

function setStatus(message, isError) {
  if (elements.status) {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#ef4444" : "#94a3b8";
  }
  if (!isError && message) {
    showToast(message, "success");
  } else if (isError && message) {
    showToast(message, "error");
  }
}

/* ================================================================
   Rule lookup
   ================================================================ */

function getRuleById(ruleId) {
  return rules.find(function (rule) {
    return rule.id === ruleId;
  }) || null;
}

/* ================================================================
   Rule list rendering (with staggered animation)
   ================================================================ */

function renderRuleList() {
  elements.ruleList.innerHTML = "";
  var paged = getPageItems(rules, rulePage, RULES_PAGE_SIZE);
  rulePage = paged.page;

  // Update rule count in sidebar if it exists
  if (elements.ruleCount) {
    elements.ruleCount.textContent = t("ruleCount", { count: rules.length });
  }

  if (!rules.length) {
    var empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("emptyRules");
    elements.ruleList.appendChild(empty);
    renderPagination(elements.rulePageInfo, elements.rulePrevPageButton, elements.ruleNextPageButton, 1, 1, 0);
    return;
  }

  paged.items.forEach(function (rule, index) {
    var urlModeLabel = rule.match.urlMode === "contains"
      ? t("urlModeContains")
      : (rule.match.urlMode === "regex" ? t("urlModeRegex") : t("urlModeExact"));
    var hitCount = getRuleLogs(logs, rule.id).length;
    var item = document.createElement("div");
    item.className = "rule-item";
    item.style.animationDelay = (index * 0.04) + "s";
    item.innerHTML =
      '<span class="rule-title">' + escapeHtml(rule.name) + '</span>' +
      '<span class="rule-meta">' + (rule.match.method || t("all")) + '</span>' +
      '<span class="rule-meta" title="' + escapeHtml(urlModeLabel) + '">' +
        escapeHtml(urlModeLabel + " · " + (rule.match.url || t("unset"))) +
      '</span>' +
      '<span><span class="badge hit-badge ' + (hitCount > 0 ? "hit" : "miss") + '" data-action="view-hits" data-rule-id="' + rule.id + '">' + String(hitCount) + '</span></span>' +
      '<span>' +
        '<label class="switch list-switch">' +
          '<input type="checkbox" ' + (rule.enabled ? "checked" : "") + ' data-action="toggle-enabled" data-rule-id="' + rule.id + '">' +
          '<span class="switch-slider"></span>' +
        '</label>' +
      '</span>' +
      '<span class="row-actions">' +
        '<button type="button" class="table-action" data-action="edit" data-rule-id="' + rule.id + '">' + t("edit") + '</button>' +
        '<button type="button" class="table-action" data-action="duplicate" data-rule-id="' + rule.id + '">' + t("duplicate") + '</button>' +
        '<button type="button" class="table-action danger-text" data-action="delete" data-rule-id="' + rule.id + '">' + t("delete") + '</button>' +
      '</span>';
    elements.ruleList.appendChild(item);
  });

  // Attach ripple to newly created buttons
  attachRippleToButtons();

  renderPagination(
    elements.rulePageInfo,
    elements.rulePrevPageButton,
    elements.ruleNextPageButton,
    paged.page,
    paged.totalPages,
    rules.length
  );
}

/* ================================================================
   Stats rendering
   ================================================================ */

/* ================================================================
   Form population
   ================================================================ */

function fillRuleForm(rule) {
  elements.ruleName.value = rule.name;
  elements.ruleEnabled.checked = rule.enabled;
  elements.matchMethod.value = rule.match.method;
  if (elements.urlMatchMode) {
    elements.urlMatchMode.value = rule.match.urlMode;
  }
  elements.urlMatchValue.value = rule.match.url;
  if (elements.rewriteMode) {
    elements.rewriteMode.value = rule.rewrite.mode;
  }
  if (elements.rewriteBody) {
    elements.rewriteBody.value = rule.rewrite.body;
  }
  updateUrlMatchModeUi();
  updateRewriteModeUi();
}

function updateRewriteModeUi() {
  if (!elements.rewriteMode || !elements.rewriteBody) return;

  var mode = elements.rewriteMode.value;
  var guide = getRewriteModeGuide(mode);
  var labelKey = mode === "json-merge"
    ? "responseBodyMerge"
    : (mode === "script" ? "responseBodyScript" : "responseBody");
  var placeholderKey = mode === "json-merge"
    ? "responseBodyMergePlaceholder"
    : (mode === "script" ? "responseBodyScriptPlaceholder" : "responseBodyPlaceholder");

  if (elements.rewriteModeHint) {
    elements.rewriteModeHint.textContent = guide.hint;
  }
  if (elements.rewriteModeExample) {
    elements.rewriteModeExample.textContent = guide.example;
  }
  if (elements.responseBodyLabel) {
    elements.responseBodyLabel.textContent = t(labelKey);
  }
  elements.rewriteBody.placeholder = t(placeholderKey);
  if (elements.formatRewriteBodyButton) {
    elements.formatRewriteBodyButton.hidden = mode === "script";
  }
}

function updateUrlMatchModeUi() {
  if (!elements.urlMatchMode) return;

  var guide = getUrlModeGuide(elements.urlMatchMode.value);
  if (elements.urlMatchModeHint) {
    elements.urlMatchModeHint.textContent = guide.hint;
  }
  if (elements.urlMatchModeExample) {
    elements.urlMatchModeExample.textContent = guide.example;
  }
}

/* ================================================================
   Modal management (with animation)
   ================================================================ */

function openRuleModal(mode, rule) {
  modalMode = mode;
  editingRuleId = rule.id;
  currentModalRule = clone(rule);
  elements.ruleModalTitle.textContent = mode === "create" ? t("createRuleTitle") : t("editRuleTitle");
  fillRuleForm(currentModalRule);
  elements.ruleModal.classList.remove("hidden");
  elements.ruleModal.setAttribute("aria-hidden", "false");
  // Focus the first input
  setTimeout(function () {
    if (elements.ruleName) elements.ruleName.focus();
  }, 100);
}

function closeRuleModal() {
  currentModalRule = null;
  elements.ruleModal.classList.add("hidden");
  elements.ruleModal.setAttribute("aria-hidden", "true");
}

let confirmAction = "";
let resetStatsReturnFocus = null;

function setConfirmDialogContent(titleKey, noteKey, messageKey, message, actionKey) {
  elements.confirmModalTitle.dataset.i18n = titleKey;
  elements.confirmModalNote.dataset.i18n = noteKey;
  elements.confirmDeleteButton.dataset.i18n = actionKey;
  if (messageKey) {
    elements.deleteModalText.dataset.i18n = messageKey;
  } else {
    delete elements.deleteModalText.dataset.i18n;
  }
  elements.confirmModalTitle.textContent = t(titleKey);
  elements.confirmModalNote.textContent = t(noteKey);
  elements.deleteModalText.textContent = message;
  elements.confirmDeleteButton.textContent = t(actionKey);
}

function showConfirmDialog() {
  elements.deleteModal.classList.remove("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "false");
  setTimeout(function () {
    elements.cancelDeleteButton.focus();
  }, 0);
}

function openDeleteModal(rule) {
  deleteRuleId = rule.id;
  confirmAction = "delete-rule";
  setConfirmDialogContent(
    "deleteRule",
    "deleteRuleNote",
    "",
    t("deleteRuleNamed", { name: rule.name }),
    "confirmDelete"
  );
  showConfirmDialog();
}

function openClearLogsConfirm() {
  confirmAction = "clear-logs";
  setConfirmDialogContent(
    "clearLogsTitle",
    "clearLogsNote",
    "clearLogsConfirm",
    t("clearLogsConfirm"),
    "confirmClearLogs"
  );
  showConfirmDialog();
}

function openResetHitsConfirm() {
  if (!hitsModalRuleId) return;
  confirmAction = "reset-hit-stats";
  resetStatsReturnFocus = document.activeElement;
  setConfirmDialogContent(
    "clearStats",
    "clearStatsNote",
    "clearStatsConfirm",
    t("clearStatsConfirm"),
    "clearStats"
  );
  // The hit records dialog stays visually behind the confirmation so cancel can
  // return to it without rebuilding its expanded rows.
  elements.hitsModal.setAttribute("aria-hidden", "true");
  elements.deleteModal.classList.add("modal-confirm-above");
  showConfirmDialog();
}

function closeDeleteModal() {
  var closedResetStatsConfirm = confirmAction === "reset-hit-stats";
  deleteRuleId = "";
  confirmAction = "";
  setConfirmDialogContent(
    "deleteRule",
    "deleteRuleNote",
    "deleteRuleConfirm",
    t("deleteRuleConfirm"),
    "confirmDelete"
  );
  elements.deleteModal.classList.remove("modal-confirm-above");
  elements.deleteModal.classList.add("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "true");
  if (elements.hitsModal && !elements.hitsModal.classList.contains("hidden")) {
    elements.hitsModal.setAttribute("aria-hidden", "false");
    if (closedResetStatsConfirm && resetStatsReturnFocus && resetStatsReturnFocus.isConnected) {
      resetStatsReturnFocus.focus();
    }
  }
  resetStatsReturnFocus = null;
}

/* Resizable — auto-injects handles on .modal-resizable cards */
(function () {
  function injectHandles(card) {
    if (card.querySelector(".resize-handle")) return;
    var left = document.createElement("div");
    left.className = "resize-handle left";
    var right = document.createElement("div");
    right.className = "resize-handle right";
    card.insertBefore(right, card.firstChild);
    card.insertBefore(left, card.firstChild);
  }

  var handle = null, card = null, startX = 0, startWidth = 0, isRight = false;

  function onMouseDown(e) {
    handle = e.target.closest(".resize-handle");
    if (!handle) return;
    card = handle.closest(".modal-resizable");
    if (!card) return;
    startX = e.clientX;
    startWidth = card.getBoundingClientRect().width;
    isRight = handle.classList.contains("right");
    handle.classList.add("active");
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!card || !handle) return;
    var dx = isRight ? e.clientX - startX : startX - e.clientX;
    var newWidth = Math.max(400, Math.min(window.innerWidth - 32, startWidth + dx));
    card.style.width = newWidth + "px";
  }

  function onMouseUp() {
    if (handle) handle.classList.remove("active");
    handle = null; card = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("mousedown", onMouseDown);

  // Auto-inject handles when modals open
  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.target.querySelectorAll(".modal-resizable").forEach(injectHandles);
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
})();

var hitsModalRuleId = null;

function openHitsModal(rule) {
  if (!elements.hitsModal) return;
  hitsModalRuleId = rule.id;
  elements.hitsModalTitle.textContent = t("hitRecordsTitle", { name: rule.name });
  var ruleLogs = getRuleLogs(logs, rule.id);
  elements.hitsList.innerHTML = "";
  if (!ruleLogs.length) {
    elements.hitsList.innerHTML = '<div class="empty-state">' + t("noHitRecords") + '</div>';
  } else {
    ruleLogs.forEach(function (l) {
      var row = document.createElement("div");
      row.className = "hit-row";
      row.dataset.logId = l.id;
      row.innerHTML =
        '<div class="hit-summary">' +
          '<span class="hit-toggle">&#9654;</span>' +
          '<span>' + formatDate(l.matchedAt) + '</span>' +
          '<span>' + escapeHtml(l.method || "-") + '</span>' +
          '<span class="hit-url" title="' + escapeHtml(l.url) + '">' + escapeHtml(l.url || "-") + '</span>' +
          (renderLogOutcomeBadge(l) || '<span>' + escapeHtml(l.resourceType || "-") + '</span>') +
        '</div>';
      var detail = document.createElement("div");
      detail.className = "hit-detail hidden";
      detail.innerHTML = renderLogDetailHTML(l.originalResponse, l.rewrittenResponse, l.outcome);
      row.appendChild(detail);
      elements.hitsList.appendChild(row);
    });
  }
  elements.hitsModal.classList.remove("hidden");
  elements.hitsModal.setAttribute("aria-hidden", "false");
}

function closeHitsModal() {
  if (!elements.hitsModal) return;
  hitsModalRuleId = null;
  elements.hitsModal.classList.add("hidden");
  elements.hitsModal.setAttribute("aria-hidden", "true");
}

// Toggle hit row expand/collapse
if (elements.hitsList) {
  elements.hitsList.addEventListener("click", function (e) {
    var summary = e.target.closest(".hit-summary");
    if (!summary) return;

    var row = summary.closest(".hit-row");
    if (!row) return;
    var logId = row.dataset.logId;
    var detail = row.querySelector(".hit-detail");
    var toggle = row.querySelector(".hit-toggle");
    if (!detail) return;
    detail.classList.toggle("hidden");
    if (detail.classList.contains("hidden")) {
      toggle.textContent = "▶";
      row.classList.remove("expanded");
    } else {
      toggle.textContent = "▼";
      row.classList.add("expanded");
    }
  });
}

// Reset hits stats from hits modal
if (elements.resetHitsStatsButton) {
  elements.resetHitsStatsButton.addEventListener("click", function () {
    openResetHitsConfirm();
  });
}

/* ================================================================
   Validation
   ================================================================ */

/* ================================================================
   Read from form
   ================================================================ */

function readRuleFromForm(existingRule) {
  var nextRule = {
    id: existingRule.id,
    enabled: elements.ruleEnabled.checked,
    name: elements.ruleName.value.trim() || t("unnamedRule"),
    match: {
      method: elements.matchMethod.value,
      urlMode: elements.urlMatchMode ? elements.urlMatchMode.value : existingRule.match.urlMode,
      url: elements.urlMatchValue.value.trim()
    },
    rewrite: {
      mode: elements.rewriteMode ? elements.rewriteMode.value : existingRule.rewrite.mode,
      body: elements.rewriteBody ? elements.rewriteBody.value : ""
    },
    stats: clone(existingRule.stats)
  };

  validateRule(nextRule);
  return nextRule;
}

function formatRewriteBody() {
  if (!elements.rewriteBody) return;

  var raw = elements.rewriteBody.value.trim();
  if (!raw) {
    setStatus(t("emptyResponseBody"), true);
    return;
  }

  try {
    elements.rewriteBody.value = JSON.stringify(JSON.parse(raw), null, 2);
    setStatus(t("responseBodyFormatted"));
  } catch (error) {
    setStatus(t("invalidJson"), true);
  }
}

/* ================================================================
   Persistence
   ================================================================ */

function saveRules(message) {
  chrome.storage.local.set({ rules: rules }, function () {
    if (chrome.runtime.lastError) {
      setStatus(t("saveFailed", { message: chrome.runtime.lastError.message }), true);
      return;
    }
    renderRuleList();
    setStatus(message || t("savedRules"));
  });
}

function loadRules() {
  chrome.storage.local.get({ rules: [], logs: [] }, function (result) {
    rules = normalizeRules(result.rules);
    logs = Array.isArray(result.logs) ? result.logs : [];
    renderRuleList();
    renderLogList();
    setStatus(t("loadedRules"));
  });
}

/* ================================================================
   Event listeners
   ================================================================ */

// Add rule
elements.addRuleButton.addEventListener("click", function () {
  var rule = createBlankRule();
  openRuleModal("create", rule);
});

// Load example rules
if (elements.loadExampleButton) {
  elements.loadExampleButton.addEventListener("click", function () {
    rules = normalizeRules([
      {
        id: "example-1",
        enabled: true,
        name: "改写用户信息",
        match: { method: "GET", url: "https://example.com/api/user/profile" },
        rewrite: { body: '{\n  "nickname": "mocked-user",\n  "avatar": "https://example.com/avatar.png"\n}' }
      },
      {
        id: "example-2",
        enabled: true,
        name: "Mock 订单列表",
        match: { method: "POST", url: "https://example.com/api/orders" },
        rewrite: { body: '{\n  "code": 0,\n  "data": { "list": [], "total": 0 }\n}' }
      },
      {
        id: "example-3",
        enabled: false,
        name: "拦截配置接口",
        match: { method: "GET", url: "https://example.com/api/config" },
        rewrite: { body: '{\n  "debug": true,\n  "env": "staging"\n}' }
      }
    ]);
    rulePage = 1;
    saveRules(t("loadedExamples"));
  });
}

// Clear logs button
if (elements.clearLogsButton) {
  elements.clearLogsButton.addEventListener("click", function () {
    if (!logs.length) {
      setStatus(t("noLogsToClear"), true);
      return;
    }
    openClearLogsConfirm();
  });
}

if (elements.formatRewriteBodyButton) {
  elements.formatRewriteBodyButton.addEventListener("click", formatRewriteBody);
}

if (elements.rewriteMode) {
  elements.rewriteMode.addEventListener("change", updateRewriteModeUi);
}

if (elements.urlMatchMode) {
  elements.urlMatchMode.addEventListener("change", updateUrlMatchModeUi);
}

if (elements.importRulesButton && elements.importRulesFile) {
  elements.importRulesButton.addEventListener("click", function () {
    elements.importRulesFile.click();
  });

  elements.importRulesFile.addEventListener("change", function () {
    importRulesFromFile(elements.importRulesFile.files && elements.importRulesFile.files[0]);
  });
}

if (elements.exportRulesButton) {
  elements.exportRulesButton.addEventListener("click", exportRules);
}

if (elements.logSearchInput) {
  elements.logSearchInput.addEventListener("input", function () {
    updateLogFiltersFromInputs();
  });
}

if (elements.logTypeFilter) {
  elements.logTypeFilter.addEventListener("change", function () {
    updateLogFiltersFromInputs();
  });
}

if (elements.localeSelect) {
  elements.localeSelect.addEventListener("change", function () {
    currentLocale = elements.localeSelect.value;
    chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: currentLocale }, function () {
      applyLocale();
      setStatus(t("loadedRules"));
    });
  });
}

if (elements.themeSelect) {
  elements.themeSelect.addEventListener("change", function () {
    currentTheme = normalizeTheme(elements.themeSelect.value);
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: currentTheme }, applyTheme);
  });
}

// Rule list delegation
elements.ruleList.addEventListener("click", function (event) {
  var button = event.target.closest("[data-action]");
  if (!button) return;

  var rule = getRuleById(button.dataset.ruleId);
  if (!rule) return;

  if (button.dataset.action === "edit") {
    openRuleModal("edit", clone(rule));
  }

  if (button.dataset.action === "duplicate") {
    duplicateRule(rule);
  }

  if (button.dataset.action === "delete") {
    openDeleteModal(rule);
  }

  if (button.dataset.action === "toggle-enabled") {
    rules = rules.map(function (item) {
      if (item.id !== rule.id) return item;
      return Object.assign({}, item, { enabled: !item.enabled });
    });
    saveRules(t("ruleEnabledUpdated"));
  }

  if (button.dataset.action === "view-hits") {
    openHitsModal(rule);
  }
});

// Log list delegation
// Log list: click card to view detail
elements.logList.addEventListener("click", function (event) {
  var card = event.target.closest(".log-card");
  if (!card) return;

  var log = logs.find(function (item) {
    return item.id === card.dataset.logId;
  });

  if (log) openLogModal(log);
});

// Modal close buttons
elements.closeRuleModalButton.addEventListener("click", closeRuleModal);
elements.closeDeleteModalButton.addEventListener("click", closeDeleteModal);
elements.closeLogModalButton.addEventListener("click", closeLogModal);
if (elements.closeHitsModalButton) elements.closeHitsModalButton.addEventListener("click", closeHitsModal);
elements.cancelDeleteButton.addEventListener("click", closeDeleteModal);

// Backdrop close
document.querySelectorAll("[data-close-modal]").forEach(function (node) {
  node.addEventListener("click", function () {
    if (node.dataset.closeModal === "rule") closeRuleModal();
    if (node.dataset.closeModal === "delete") closeDeleteModal();
    if (node.dataset.closeModal === "log") closeLogModal();
    if (node.dataset.closeModal === "hits") closeHitsModal();
  });
});

// Escape key to close modals
document.addEventListener("keydown", function (event) {
  if (event.key !== "Escape") return;
  if (elements.hitsModal && !elements.hitsModal.classList.contains("hidden")) closeHitsModal();
  else if (elements.logModal && !elements.logModal.classList.contains("hidden")) closeLogModal();
  else if (elements.deleteModal && !elements.deleteModal.classList.contains("hidden")) closeDeleteModal();
  else if (elements.ruleModal && !elements.ruleModal.classList.contains("hidden")) closeRuleModal();
});

// Save form
elements.ruleForm.addEventListener("submit", function (event) {
  event.preventDefault();

  try {
    var nextRule = readRuleFromForm(currentModalRule || createBlankRule());

    if (modalMode === "create") {
      rules.unshift(nextRule);
      rulePage = 1;
      saveRules(t("ruleCreated"));
    } else {
      rules = rules.map(function (rule) {
        return rule.id === nextRule.id ? nextRule : rule;
      });
      saveRules(t("ruleSaved"));
    }

    closeRuleModal();
  } catch (error) {
    setStatus(error.message, true);
  }
});

// Confirm delete
elements.confirmDeleteButton.addEventListener("click", function () {
  if (confirmAction === "reset-hit-stats") {
    logs = logs.filter(function (log) {
      return log.ruleId !== hitsModalRuleId;
    });
    rules = rules.map(function (rule) {
      if (rule.id !== hitsModalRuleId) return rule;
      var updated = clone(rule);
      updated.stats = createEmptyStats();
      return updated;
    });
    chrome.storage.local.set({ rules: rules, logs: logs }, function () {
      renderRuleList();
      renderLogList();
      setStatus(t("statsCleared"));
    });
    closeHitsModal();
    closeDeleteModal();
    return;
  }

  if (confirmAction === "clear-logs") {
    logs = [];
    rules = rules.map(function (rule) {
      var updated = clone(rule);
      updated.stats = { hitCount: 0, lastMatchedAt: "", lastMatchedUrl: "", lastResourceType: "" };
      return updated;
    });
    chrome.storage.local.set({ logs: [], rules: rules }, function () {
      renderRuleList();
      renderLogList();
      setStatus(t("logsCleared"));
    });
    closeDeleteModal();
    return;
  }

  rules = rules.filter(function (rule) {
    return rule.id !== deleteRuleId;
  });
  logs = logs.filter(function (log) {
    return log.ruleId !== deleteRuleId;
  });

  rulePage = Math.min(rulePage, Math.max(1, Math.ceil(rules.length / RULES_PAGE_SIZE)));
  logPage = Math.min(logPage, Math.max(1, Math.ceil(logs.length / LOGS_PAGE_SIZE)));
  chrome.storage.local.set({ rules: rules, logs: logs }, function () {
    if (chrome.runtime.lastError) {
      setStatus(t("deleteFailed", { message: chrome.runtime.lastError.message }), true);
      return;
    }

    renderRuleList();
    renderLogList();
    setStatus(t("ruleDeleted"));
  });
  closeDeleteModal();
});

// Pagination
elements.rulePrevPageButton.addEventListener("click", function () {
  rulePage = Math.max(1, rulePage - 1);
  renderRuleList();
});

elements.ruleNextPageButton.addEventListener("click", function () {
  rulePage += 1;
  renderRuleList();
});

elements.logPrevPageButton.addEventListener("click", function () {
  logPage = Math.max(1, logPage - 1);
  renderLogList();
});

elements.logNextPageButton.addEventListener("click", function () {
  logPage += 1;
  renderLogList();
});

// Storage change listener
chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== "local") return;

  if (changes.rules) {
    rules = normalizeRules(changes.rules.newValue);
    rulePage = Math.min(rulePage, Math.max(1, Math.ceil(rules.length / RULES_PAGE_SIZE)));
    renderRuleList();
  }

  if (changes.logs) {
    logs = Array.isArray(changes.logs.newValue) ? changes.logs.newValue : [];
    logPage = Math.min(logPage, Math.max(1, Math.ceil(getFilteredLogs().length / LOGS_PAGE_SIZE)));
    renderRuleList();
    renderLogList();
  }
});

// Initial ripple attachment
attachRippleToButtons();

// Monitor for dynamically added buttons (MutationObserver)
if (window.MutationObserver) {
  var observer = new MutationObserver(function () {
    attachRippleToButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ================================================================
   Info icon tooltip
   ================================================================ */

(function () {
  var tooltip = null;
  var activeIcon = null;

  function createTooltip() {
    tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
  }

  function showTooltip(icon) {
    if (!tooltip) createTooltip();
    activeIcon = icon;
    tooltip.innerHTML = icon.dataset.tip || "";
    tooltip.classList.add("show");
    positionTooltip(icon);
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove("show");
    activeIcon = null;
  }

  function positionTooltip(icon) {
    var rect = icon.getBoundingClientRect();
    var tipWidth = tooltip.offsetWidth;
    var left = rect.left - tipWidth / 2 + rect.width / 2;
    var top = rect.bottom + 8;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tipWidth > window.innerWidth - 8) left = window.innerWidth - tipWidth - 8;

    // Flip above if not enough room below
    if (top + 200 > window.innerHeight) {
      top = rect.top - 8;
      tooltip.style.transform = "translateY(-100%)";
    } else {
      tooltip.style.transform = "translateY(0)";
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  document.addEventListener("mouseover", function (e) {
    var icon = e.target.closest(".info-icon");
    if (!icon) return;
    showTooltip(icon);
  });

  document.addEventListener("mouseout", function (e) {
    var icon = e.target.closest(".info-icon");
    if (!icon) return;
    hideTooltip();
  });

  document.addEventListener("scroll", function () {
    if (!activeIcon || !tooltip) return;
    positionTooltip(activeIcon);
  }, true);
})();

/* ================================================================
   Bootstrap
   ================================================================ */

chrome.storage.local.get({
  [LOCALE_STORAGE_KEY]: normalizeLocale(navigator.language),
  [THEME_STORAGE_KEY]: DEFAULT_THEME
}, function (result) {
  currentLocale = I18N[result[LOCALE_STORAGE_KEY]] ? result[LOCALE_STORAGE_KEY] : DEFAULT_LOCALE;
  currentTheme = normalizeTheme(result[THEME_STORAGE_KEY]);
  applyTheme();
  applyLocale();
  loadRules();
});
