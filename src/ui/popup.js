const RULES_PAGE_SIZE = 10;
const LOGS_PAGE_SIZE = 10;
const DEFAULT_THEME = "light";
const THEME_STORAGE_KEY = "theme";
const INTERCEPTION_ENABLED_KEY = "interceptionEnabled";
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

elements.interceptionEnabled = document.getElementById("interceptionEnabled");
elements.interceptionStatusText = document.getElementById("interceptionStatusText");
elements.ruleSearchInput = document.getElementById("ruleSearchInput");
elements.ruleStatusFilter = document.getElementById("ruleStatusFilter");
elements.ruleModeFilter = document.getElementById("ruleModeFilter");
elements.clearRuleFiltersButton = document.getElementById("clearRuleFiltersButton");
elements.cancelRuleButton = document.getElementById("cancelRuleButton");
elements.ruleNameError = document.getElementById("ruleNameError");
elements.urlMatchError = document.getElementById("urlMatchError");
elements.rewriteBodyError = document.getElementById("rewriteBodyError");
elements.uiTooltip = document.getElementById("uiTooltip");

let currentLocale = DEFAULT_LOCALE;
let currentTheme = DEFAULT_THEME;
let interceptionEnabled = true;
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
let ruleFilters = {
  keyword: "",
  status: "",
  mode: ""
};
let rulePage = 1;
let logPage = 1;
let ruleModalSnapshot = "";
let pendingImportedRules = null;
let tooltipTimer = 0;
let tooltipTarget = null;

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

function updateInterceptionUi() {
  if (elements.interceptionEnabled) {
    elements.interceptionEnabled.checked = interceptionEnabled;
  }
  if (elements.interceptionStatusText) {
    elements.interceptionStatusText.textContent = t(interceptionEnabled ? "interceptionOn" : "interceptionOff");
    elements.interceptionStatusText.dataset.state = interceptionEnabled ? "on" : "off";
  }
  document.documentElement.dataset.interception = interceptionEnabled ? "on" : "off";
}

function applyLocale() {
  document.documentElement.lang = currentLocale;
  document.title = t("managerTitle");

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
  document.querySelectorAll("[data-i18n-tooltip]").forEach(function (node) {
    node.dataset.tooltip = t(node.dataset.i18nTooltip);
  });

  var localeSelect = document.getElementById("localeSelect");
  if (localeSelect) {
    localeSelect.value = currentLocale;
  }

  if (elements.ruleModal && !elements.ruleModal.classList.contains("hidden")) {
    elements.ruleModalTitle.textContent = t(modalMode === "create" ? "createRuleTitle" : "editRuleTitle");
  }
  updateInterceptionUi();
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
      var conflicts = imported.filter(function (rule) {
        return existingIds.has(rule.id);
      }).length;
      var nextRules = imported.map(function (rule) {
        return resetRuleIdentity(rule, existingIds);
      });
      pendingImportedRules = {
        rules: nextRules,
        conflicts: conflicts
      };
      confirmAction = "import-rules";
      setConfirmDialogContent(
        "importPreviewTitle",
        "importAppendNote",
        "",
        t("importPreviewMessage", { count: nextRules.length, conflicts: conflicts }),
        "confirmImport"
      );
      showConfirmDialog();
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
  var nextRules = rules.slice();
  if (index === -1) {
    nextRules.unshift(duplicated);
    rulePage = 1;
  } else {
    nextRules.splice(index + 1, 0, duplicated);
    rulePage = Math.floor((index + 1) / RULES_PAGE_SIZE) + 1;
  }
  saveRules(t("duplicatedRule"), nextRules);
}

function moveRule(ruleId, offset) {
  var visibleRules = getFilteredRules();
  var visibleIndex = visibleRules.findIndex(function (rule) { return rule.id === ruleId; });
  var targetVisibleIndex = visibleIndex + offset;
  if (visibleIndex < 0 || targetVisibleIndex < 0 || targetVisibleIndex >= visibleRules.length) return;

  var nextRules = reorderRulesByVisiblePositions(rules, visibleRules, visibleIndex, targetVisibleIndex);
  rulePage = Math.floor(targetVisibleIndex / RULES_PAGE_SIZE) + 1;
  saveRules(t("ruleMoved", {
    name: visibleRules[visibleIndex].name,
    position: targetVisibleIndex + 1
  }), nextRules, function () {
    focusRuleDragHandle(ruleId);
  });
}

function focusRuleDragHandle(ruleId) {
  var handles = elements.ruleList.querySelectorAll("[data-drag-handle]");
  var handle = Array.from(handles).find(function (item) {
    return item.dataset.ruleId === ruleId;
  });
  if (handle) handle.focus();
}

function initializeRuleSortable() {
  if (typeof Sortable === "undefined") {
    setStatus(t("dragUnavailable"), true);
    return;
  }

  Sortable.create(elements.ruleList, {
    animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    draggable: ".rule-item",
    handle: ".drag-handle",
    ghostClass: "rule-sort-ghost",
    chosenClass: "rule-sort-chosen",
    dragClass: "rule-sort-dragging",
    delay: 120,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    fallbackTolerance: 4,
    fallbackOnBody: true,
    onStart: function () {
      document.body.classList.add("is-sorting");
    },
    onEnd: function (event) {
      document.body.classList.remove("is-sorting");
      if (
        event.oldDraggableIndex == null ||
        event.newDraggableIndex == null ||
        event.oldDraggableIndex === event.newDraggableIndex
      ) {
        return;
      }

      var visibleRules = getFilteredRules();
      var pageStart = (rulePage - 1) * RULES_PAGE_SIZE;
      var fromIndex = pageStart + event.oldDraggableIndex;
      var toIndex = pageStart + event.newDraggableIndex;
      var movedRule = visibleRules[fromIndex];
      var nextRules = reorderRulesByVisiblePositions(rules, visibleRules, fromIndex, toIndex);
      saveRules(t("ruleOrderUpdated"), nextRules, function () {
        if (movedRule) focusRuleDragHandle(movedRule.id);
      }, renderRuleList);
    }
  });
}

/* ================================================================
   Toast notification system
   ================================================================ */

function showToast(message, type) {
  type = type || "";
  if (!elements.toastContainer) return;

  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  var copy = document.createElement("span");
  copy.className = "toast-copy";
  copy.textContent = message;
  var closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "toast-close";
  closeButton.setAttribute("aria-label", t("dismiss"));
  closeButton.textContent = "\u00d7";
  toast.appendChild(copy);
  toast.appendChild(closeButton);
  elements.toastContainer.appendChild(toast);

  var removed = false;
  function removeToast() {
    if (removed) return;
    removed = true;
    toast.classList.add("removing");
    toast.addEventListener("animationend", function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  closeButton.addEventListener("click", removeToast);
  setTimeout(removeToast, Math.min(8000, Math.max(4500, String(message).length * 90)));
}

function hideTooltip() {
  clearTimeout(tooltipTimer);
  tooltipTimer = 0;
  tooltipTarget = null;
  if (elements.uiTooltip) elements.uiTooltip.hidden = true;
}

function showTooltip(target, delay) {
  if (!elements.uiTooltip || !target || !target.dataset.tooltip) return;
  if (tooltipTarget === target && !elements.uiTooltip.hidden) return;

  clearTimeout(tooltipTimer);
  tooltipTarget = target;
  tooltipTimer = setTimeout(function () {
    if (tooltipTarget !== target || !target.isConnected) return;

    elements.uiTooltip.textContent = target.dataset.tooltip;
    elements.uiTooltip.hidden = false;

    var targetRect = target.getBoundingClientRect();
    var tooltipRect = elements.uiTooltip.getBoundingClientRect();
    var left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    var top = targetRect.top - tooltipRect.height - 7;
    if (top < 8) top = targetRect.bottom + 7;

    elements.uiTooltip.style.left = Math.round(left) + "px";
    elements.uiTooltip.style.top = Math.round(top) + "px";
  }, delay);
}

/* ================================================================
   Status bar
   ================================================================ */

function setStatus(message, isError) {
  if (elements.status) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", Boolean(isError));
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

function getFilteredRules() {
  var keyword = ruleFilters.keyword.trim().toLowerCase();

  return rules.filter(function (rule) {
    if (ruleFilters.status === "enabled" && !rule.enabled) return false;
    if (ruleFilters.status === "disabled" && rule.enabled) return false;
    if (ruleFilters.mode && rule.rewrite.mode !== ruleFilters.mode) return false;
    if (!keyword) return true;

    return [rule.name, rule.match.method, rule.match.url].some(function (value) {
      return String(value || "").toLowerCase().indexOf(keyword) !== -1;
    });
  });
}

function syncRuleFilterInputs() {
  if (elements.ruleSearchInput) elements.ruleSearchInput.value = ruleFilters.keyword;
  if (elements.ruleStatusFilter) elements.ruleStatusFilter.value = ruleFilters.status;
  if (elements.ruleModeFilter) elements.ruleModeFilter.value = ruleFilters.mode;
}

function updateRuleFiltersFromInputs() {
  ruleFilters.keyword = elements.ruleSearchInput ? elements.ruleSearchInput.value : "";
  ruleFilters.status = elements.ruleStatusFilter ? elements.ruleStatusFilter.value : "";
  ruleFilters.mode = elements.ruleModeFilter ? elements.ruleModeFilter.value : "";
  rulePage = 1;
  renderRuleList();
}

function createEmptyState(message, actionLabel, action) {
  var empty = document.createElement("div");
  empty.className = "empty-state";
  var copy = document.createElement("p");
  copy.textContent = message;
  empty.appendChild(copy);
  if (actionLabel && action) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = actionLabel;
    button.addEventListener("click", action);
    empty.appendChild(button);
  }
  return empty;
}

function getRuleActionIcon(action) {
  var icons = {
    edit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 14.5V16h1.5L14.7 6.8l-1.5-1.5L4 14.5Z"></path><path d="m12.5 6 1.4-1.4a1 1 0 0 1 1.5 0l.1.1a1 1 0 0 1 0 1.5L14 7.5"></path></svg>',
    duplicate: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6" y="6" width="9" height="9" rx="1.5"></rect><path d="M4 12H3.5A1.5 1.5 0 0 1 2 10.5v-7A1.5 1.5 0 0 1 3.5 2h7A1.5 1.5 0 0 1 12 3.5V4"></path></svg>',
    delete: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 3.5h4M6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4"></path></svg>'
  };
  return icons[action] || "";
}

function renderRuleAction(action, ruleId, label, disabled, danger) {
  return '<button type="button" class="table-action icon-action' + (danger ? " danger-text" : "") +
    '" data-action="' + action + '" data-rule-id="' + ruleId + '" data-tooltip="' + escapeHtml(label) +
    '" aria-label="' + escapeHtml(label) + '" ' + (disabled ? "disabled" : "") + '>' +
    getRuleActionIcon(action) + '</button>';
}

/* ================================================================
   Rule list rendering (with staggered animation)
   ================================================================ */

function renderRuleList() {
  elements.ruleList.innerHTML = "";
  syncRuleFilterInputs();
  var filteredRules = getFilteredRules();
  var paged = getPageItems(filteredRules, rulePage, RULES_PAGE_SIZE);
  rulePage = paged.page;

  // Update rule count in sidebar if it exists
  if (elements.ruleCount) {
    elements.ruleCount.textContent = t("ruleCount", { count: rules.length });
  }

  if (!rules.length) {
    elements.ruleList.appendChild(createEmptyState(t("emptyRules"), t("addFirstRule"), function () {
      openRuleModal("create", createBlankRule());
    }));
    renderPagination(elements.rulePageInfo, elements.rulePrevPageButton, elements.ruleNextPageButton, 1, 1, 0);
    return;
  }

  if (!filteredRules.length) {
    elements.ruleList.appendChild(createEmptyState(t("emptyFilteredRules"), t("clearFilters"), function () {
      ruleFilters = { keyword: "", status: "", mode: "" };
      renderRuleList();
    }));
    renderPagination(elements.rulePageInfo, elements.rulePrevPageButton, elements.ruleNextPageButton, 1, 1, 0);
    return;
  }

  paged.items.forEach(function (rule) {
    var urlModeLabel = rule.match.urlMode === "contains"
      ? t("urlModeContains")
      : (rule.match.urlMode === "regex" ? t("urlModeRegex") : t("urlModeExact"));
    var hitCount = getRuleLogs(logs, rule.id).length;
    var absoluteIndex = rules.findIndex(function (item) { return item.id === rule.id; });
    var escapedRuleId = escapeHtml(rule.id);
    var matchSummary = urlModeLabel + " · " + (rule.match.url || t("unset"));
    var item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML =
      '<span class="rule-title" data-label="' + escapeHtml(t("rule")) + '"><span class="rule-title-value">' +
        '<button type="button" class="drag-handle" data-drag-handle data-rule-id="' + escapedRuleId + '" aria-describedby="ruleOrderHint ruleSortHelp" data-tooltip="' + escapeHtml(t("dragRule", { name: rule.name })) + '" aria-label="' + escapeHtml(t("dragRule", { name: rule.name })) + '">' +
          '<svg viewBox="0 0 16 20" aria-hidden="true"><circle cx="5" cy="5" r="1.25"></circle><circle cx="11" cy="5" r="1.25"></circle><circle cx="5" cy="10" r="1.25"></circle><circle cx="11" cy="10" r="1.25"></circle><circle cx="5" cy="15" r="1.25"></circle><circle cx="11" cy="15" r="1.25"></circle></svg>' +
        '</button>' +
        '<span class="rule-position" aria-label="' + escapeHtml(t("rulePriority", { position: absoluteIndex + 1 })) + '">' + String(absoluteIndex + 1) + '</span><span>' + escapeHtml(rule.name) + '</span></span></span>' +
      '<span class="rule-meta" data-label="' + escapeHtml(t("method")) + '">' + (rule.match.method || t("all")) + '</span>' +
      '<span class="rule-meta" data-label="URL" title="' + escapeHtml(matchSummary) + '">' +
        escapeHtml(matchSummary) +
      '</span>' +
      '<span data-label="' + escapeHtml(t("hits")) + '"><button type="button" class="badge hit-badge ' + (hitCount > 0 ? "hit" : "miss") + '" data-action="view-hits" data-rule-id="' + escapedRuleId + '" aria-label="' + escapeHtml(t("viewRuleHits", { name: rule.name, count: hitCount })) + '">' + String(hitCount) + '</button></span>' +
      '<span data-label="' + escapeHtml(t("status")) + '">' +
        '<label class="switch list-switch">' +
          '<input type="checkbox" ' + (rule.enabled ? "checked" : "") + ' data-action="toggle-enabled" data-rule-id="' + escapedRuleId + '" aria-label="' + escapeHtml(t("toggleRule", { name: rule.name })) + '">' +
          '<span class="switch-slider"></span>' +
        '</label>' +
      '</span>' +
      '<span class="row-actions" data-label="' + escapeHtml(t("actions")) + '">' +
        renderRuleAction("edit", escapedRuleId, t("editRuleNamed", { name: rule.name })) +
        renderRuleAction("duplicate", escapedRuleId, t("duplicateRuleNamed", { name: rule.name })) +
        renderRuleAction("delete", escapedRuleId, t("deleteRuleNamedAction", { name: rule.name }), false, true) +
      '</span>';
    elements.ruleList.appendChild(item);
  });

  renderPagination(
    elements.rulePageInfo,
    elements.rulePrevPageButton,
    elements.ruleNextPageButton,
    paged.page,
    paged.totalPages,
    filteredRules.length
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

var modalReturnFocusMap = new WeakMap();
var confirmParentModal = null;

function getFocusableElements(modal) {
  return Array.from(modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(function (node) {
    return !node.hidden && node.offsetParent !== null;
  });
}

function syncPageInertState() {
  var hasOpenModal = Boolean(document.querySelector(".modal:not(.hidden)"));
  var app = document.querySelector(".app");
  if (app) app.inert = hasOpenModal;
}

function showModal(modal, initialFocus) {
  if (!modal || !modal.classList.contains("hidden")) return;
  modalReturnFocusMap.set(modal, document.activeElement);
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  syncPageInertState();
  setTimeout(function () {
    var target = initialFocus || getFocusableElements(modal)[0];
    if (target) target.focus();
  }, 0);
}

function hideModal(modal, restoreFocus) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  syncPageInertState();
  var returnFocus = modalReturnFocusMap.get(modal);
  modalReturnFocusMap.delete(modal);
  if (restoreFocus !== false && returnFocus) {
    if (returnFocus.isConnected) {
      returnFocus.focus();
    } else if (returnFocus.dataset && returnFocus.dataset.action && returnFocus.dataset.ruleId) {
      var replacement = Array.from(document.querySelectorAll("[data-action][data-rule-id]")).find(function (node) {
        return node.dataset.action === returnFocus.dataset.action &&
          node.dataset.ruleId === returnFocus.dataset.ruleId;
      });
      if (replacement) replacement.focus();
      else if (elements.addRuleButton) elements.addRuleButton.focus();
    } else if (elements.addRuleButton) {
      elements.addRuleButton.focus();
    }
  }
}

function getRuleFormSnapshot() {
  return JSON.stringify({
    name: elements.ruleName.value,
    enabled: elements.ruleEnabled.checked,
    method: elements.matchMethod.value,
    urlMode: elements.urlMatchMode.value,
    url: elements.urlMatchValue.value,
    rewriteMode: elements.rewriteMode.value,
    body: elements.rewriteBody.value
  });
}

function openRuleModal(mode, rule) {
  modalMode = mode;
  editingRuleId = rule.id;
  currentModalRule = clone(rule);
  elements.ruleModalTitle.textContent = mode === "create" ? t("createRuleTitle") : t("editRuleTitle");
  clearFieldErrors();
  fillRuleForm(currentModalRule);
  ruleModalSnapshot = getRuleFormSnapshot();
  showModal(elements.ruleModal, elements.ruleName);
}

function closeRuleModal() {
  currentModalRule = null;
  ruleModalSnapshot = "";
  hideModal(elements.ruleModal);
}

let confirmAction = "";

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
  var isImport = actionKey === "confirmImport";
  elements.confirmDeleteButton.classList.toggle("danger", !isImport);
  elements.confirmDeleteButton.classList.toggle("primary", isImport);
  elements.deleteModal.querySelector(".confirm-dialog").classList.toggle("is-neutral", isImport);
}

function showConfirmDialog() {
  confirmParentModal = [elements.hitsModal, elements.ruleModal, elements.logModal].find(function (modal) {
    return modal && !modal.classList.contains("hidden") && modal !== elements.deleteModal;
  }) || null;
  if (confirmParentModal) {
    confirmParentModal.setAttribute("aria-hidden", "true");
    elements.deleteModal.classList.add("modal-confirm-above");
  }
  showModal(elements.deleteModal, elements.cancelDeleteButton);
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
  setConfirmDialogContent(
    "clearStats",
    "clearStatsNote",
    "clearStatsConfirm",
    t("clearStatsConfirm"),
    "clearStats"
  );
  showConfirmDialog();
}

function closeDeleteModal() {
  deleteRuleId = "";
  confirmAction = "";
  pendingImportedRules = null;
  setConfirmDialogContent(
    "deleteRule",
    "deleteRuleNote",
    "deleteRuleConfirm",
    t("deleteRuleConfirm"),
    "confirmDelete"
  );
  elements.deleteModal.classList.remove("modal-confirm-above");
  if (confirmParentModal && !confirmParentModal.classList.contains("hidden")) {
    confirmParentModal.setAttribute("aria-hidden", "false");
  }
  hideModal(elements.deleteModal);
  confirmParentModal = null;
}

function requestCloseRuleModal() {
  if (getRuleFormSnapshot() === ruleModalSnapshot) {
    closeRuleModal();
    return;
  }

  confirmAction = "discard-rule";
  setConfirmDialogContent(
    "discardChangesTitle",
    "discardChangesNote",
    "discardChangesConfirm",
    t("discardChangesConfirm"),
    "discardChanges"
  );
  showConfirmDialog();
}

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
      var detailId = "hit-detail-" + String(l.id).replace(/[^a-z0-9_-]/gi, "");
      row.innerHTML =
        '<button type="button" class="hit-summary" aria-expanded="false" aria-controls="' + detailId + '">' +
          '<span class="hit-toggle">&#9654;</span>' +
          '<span>' + formatDate(l.matchedAt) + '</span>' +
          '<span>' + escapeHtml(l.method || "-") + '</span>' +
          '<span class="hit-url" title="' + escapeHtml(l.url) + '">' + escapeHtml(l.url || "-") + '</span>' +
          (renderLogOutcomeBadge(l) || '<span>' + escapeHtml(l.resourceType || "-") + '</span>') +
        '</button>';
      var detail = document.createElement("div");
      detail.id = detailId;
      detail.className = "hit-detail hidden";
      detail.innerHTML = renderLogDetailHTML(l.originalResponse, l.rewrittenResponse, l.outcome, l);
      row.appendChild(detail);
      elements.hitsList.appendChild(row);
    });
  }
  showModal(elements.hitsModal, elements.closeHitsModalButton);
}

function closeHitsModal() {
  if (!elements.hitsModal) return;
  hitsModalRuleId = null;
  hideModal(elements.hitsModal);
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
      summary.setAttribute("aria-expanded", "false");
    } else {
      toggle.textContent = "▼";
      row.classList.add("expanded");
      summary.setAttribute("aria-expanded", "true");
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

function clearFieldErrors() {
  [
    ["ruleName", elements.ruleName, elements.ruleNameError],
    ["urlMatchValue", elements.urlMatchValue, elements.urlMatchError],
    ["rewriteBody", elements.rewriteBody, elements.rewriteBodyError]
  ].forEach(function (entry) {
    var input = entry[1];
    var error = entry[2];
    if (input) input.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  });
}

function showFieldError(error) {
  var input = elements[error.field];
  var errorElement = {
    ruleName: elements.ruleNameError,
    urlMatchValue: elements.urlMatchError,
    rewriteBody: elements.rewriteBodyError
  }[error.field];

  if (!input || !errorElement) return false;
  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = error.message;
  errorElement.hidden = false;
  input.focus();
  return true;
}

function readRuleFromForm(existingRule) {
  var nextRule = {
    id: existingRule.id,
    enabled: elements.ruleEnabled.checked,
    name: elements.ruleName.value.trim(),
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
    var emptyError = createRuleValidationError(t("emptyResponseBody"), "rewriteBody");
    showFieldError(emptyError);
    setStatus(emptyError.message, true);
    return;
  }

  try {
    elements.rewriteBody.value = JSON.stringify(JSON.parse(raw), null, 2);
    elements.rewriteBody.removeAttribute("aria-invalid");
    elements.rewriteBodyError.hidden = true;
    elements.rewriteBodyError.textContent = "";
    setStatus(t("responseBodyFormatted"));
  } catch (error) {
    var invalidError = createRuleValidationError(t("invalidJson"), "rewriteBody");
    showFieldError(invalidError);
    setStatus(invalidError.message, true);
  }
}

/* ================================================================
   Persistence
   ================================================================ */

function saveState(nextRules, nextLogs, message, onSuccess, onError) {
  var values = { rules: nextRules };
  if (Array.isArray(nextLogs)) values.logs = nextLogs;

  chrome.storage.local.set(values, function () {
    if (chrome.runtime.lastError) {
      setStatus(t("saveFailed", { message: chrome.runtime.lastError.message }), true);
      if (onError) onError();
      return;
    }
    rules = nextRules;
    if (Array.isArray(nextLogs)) logs = nextLogs;
    renderRuleList();
    if (Array.isArray(nextLogs)) renderLogList();
    setStatus(message || t("savedRules"));
    if (onSuccess) onSuccess();
  });
}

function saveRules(message, nextRules, onSuccess, onError) {
  saveState(nextRules || rules, null, message, onSuccess, onError);
}

function savePreference(values, onSuccess, onError) {
  chrome.storage.local.set(values, function () {
    if (chrome.runtime.lastError) {
      setStatus(t("saveFailed", { message: chrome.runtime.lastError.message }), true);
      if (onError) onError();
      return;
    }
    if (onSuccess) onSuccess();
  });
}

function loadRules() {
  chrome.storage.local.get({ rules: [], logs: [], [INTERCEPTION_ENABLED_KEY]: true }, function (result) {
    rules = normalizeRules(result.rules);
    logs = Array.isArray(result.logs) ? result.logs : [];
    interceptionEnabled = result[INTERCEPTION_ENABLED_KEY] !== false;
    updateInterceptionUi();
    renderRuleList();
    renderLogList();
    setStatus(t("loadedRules"));
  });
}

/* ================================================================
   Event listeners
   ================================================================ */

document.addEventListener("pointerover", function (event) {
  var target = event.target.closest("[data-tooltip]");
  if (target && !target.contains(event.relatedTarget)) showTooltip(target, 40);
});

document.addEventListener("pointerout", function (event) {
  var target = event.target.closest("[data-tooltip]");
  if (target && !target.contains(event.relatedTarget)) hideTooltip();
});

document.addEventListener("focusin", function (event) {
  var target = event.target.closest("[data-tooltip]");
  if (target) showTooltip(target, 0);
});

document.addEventListener("focusout", function (event) {
  if (event.target.closest("[data-tooltip]")) hideTooltip();
});

document.addEventListener("pointerdown", hideTooltip);
window.addEventListener("scroll", hideTooltip, true);
window.addEventListener("resize", hideTooltip);

// Add rule
elements.addRuleButton.addEventListener("click", function () {
  var rule = createBlankRule();
  openRuleModal("create", rule);
});

// Load example rules
if (elements.loadExampleButton) {
  elements.loadExampleButton.addEventListener("click", function () {
    var exampleRules = normalizeRules(ResponseRewriterDefaults.createRules());
    rulePage = 1;
    saveRules(t("loadedExamples"), exampleRules);
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

if (elements.ruleSearchInput) {
  elements.ruleSearchInput.addEventListener("input", updateRuleFiltersFromInputs);
}

if (elements.ruleStatusFilter) {
  elements.ruleStatusFilter.addEventListener("change", updateRuleFiltersFromInputs);
}

if (elements.ruleModeFilter) {
  elements.ruleModeFilter.addEventListener("change", updateRuleFiltersFromInputs);
}

if (elements.clearRuleFiltersButton) {
  elements.clearRuleFiltersButton.addEventListener("click", function () {
    ruleFilters = { keyword: "", status: "", mode: "" };
    rulePage = 1;
    renderRuleList();
  });
}

if (elements.localeSelect) {
  elements.localeSelect.addEventListener("change", function () {
    var nextLocale = elements.localeSelect.value;
    savePreference({ [LOCALE_STORAGE_KEY]: nextLocale }, function () {
      currentLocale = nextLocale;
      applyLocale();
      setStatus(t("loadedRules"));
    }, function () {
      elements.localeSelect.value = currentLocale;
    });
  });
}

if (elements.themeSelect) {
  elements.themeSelect.addEventListener("change", function () {
    var nextTheme = normalizeTheme(elements.themeSelect.value);
    savePreference({ [THEME_STORAGE_KEY]: nextTheme }, function () {
      currentTheme = nextTheme;
      applyTheme();
    }, function () {
      elements.themeSelect.value = currentTheme;
    });
  });
}

if (elements.interceptionEnabled) {
  elements.interceptionEnabled.addEventListener("change", function () {
    var nextEnabled = elements.interceptionEnabled.checked;
    elements.interceptionEnabled.disabled = true;
    savePreference({ [INTERCEPTION_ENABLED_KEY]: nextEnabled }, function () {
      interceptionEnabled = nextEnabled;
      elements.interceptionEnabled.disabled = false;
      updateInterceptionUi();
      setStatus(t(nextEnabled ? "interceptionEnabledMessage" : "interceptionPausedMessage"));
    }, function () {
      elements.interceptionEnabled.disabled = false;
      updateInterceptionUi();
    });
  });
}

[elements.ruleName, elements.urlMatchValue, elements.rewriteBody].forEach(function (input) {
  if (!input) return;
  input.addEventListener("input", function () {
    if (!input.hasAttribute("aria-invalid")) return;
    input.removeAttribute("aria-invalid");
    var describedBy = input.getAttribute("aria-describedby");
    if (!describedBy) return;
    describedBy.split(/\s+/).forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.classList.contains("field-error")) {
        node.hidden = true;
        node.textContent = "";
      }
    });
  });
});

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
    var toggledRules = rules.map(function (item) {
      if (item.id !== rule.id) return item;
      return Object.assign({}, item, { enabled: !item.enabled });
    });
    saveRules(t("ruleEnabledUpdated"), toggledRules);
  }

  if (button.dataset.action === "view-hits") {
    openHitsModal(rule);
  }
});

elements.ruleList.addEventListener("keydown", function (event) {
  var handle = event.target.closest("[data-drag-handle]");
  if (!handle || !event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;

  event.preventDefault();
  moveRule(handle.dataset.ruleId, event.key === "ArrowUp" ? -1 : 1);
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
elements.closeRuleModalButton.addEventListener("click", requestCloseRuleModal);
if (elements.cancelRuleButton) elements.cancelRuleButton.addEventListener("click", requestCloseRuleModal);
elements.closeDeleteModalButton.addEventListener("click", closeDeleteModal);
elements.closeLogModalButton.addEventListener("click", closeLogModal);
if (elements.closeHitsModalButton) elements.closeHitsModalButton.addEventListener("click", closeHitsModal);
elements.cancelDeleteButton.addEventListener("click", closeDeleteModal);

// Backdrop close
document.querySelectorAll("[data-close-modal]").forEach(function (node) {
  node.addEventListener("click", function () {
    if (node.dataset.closeModal === "rule") requestCloseRuleModal();
    if (node.dataset.closeModal === "delete") closeDeleteModal();
    if (node.dataset.closeModal === "log") closeLogModal();
    if (node.dataset.closeModal === "hits") closeHitsModal();
  });
});

function getTopOpenModal() {
  return [elements.deleteModal, elements.hitsModal, elements.logModal, elements.ruleModal].find(function (modal) {
    return modal && !modal.classList.contains("hidden") && modal.getAttribute("aria-hidden") !== "true";
  }) || null;
}

// Keep keyboard focus inside the topmost modal and close only that modal.
document.addEventListener("keydown", function (event) {
  var topModal = getTopOpenModal();
  if (!topModal) return;

  if (event.key === "Tab") {
    var focusable = getFocusableElements(topModal);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }

  if (event.key !== "Escape") return;
  event.preventDefault();
  if (topModal === elements.deleteModal) closeDeleteModal();
  else if (topModal === elements.hitsModal) closeHitsModal();
  else if (topModal === elements.logModal) closeLogModal();
  else if (topModal === elements.ruleModal) requestCloseRuleModal();
});

// Save form
elements.ruleForm.addEventListener("submit", function (event) {
  event.preventDefault();
  clearFieldErrors();

  try {
    var nextRule = readRuleFromForm(currentModalRule || createBlankRule());
    var nextRules;

    if (modalMode === "create") {
      nextRules = [nextRule].concat(rules);
      rulePage = 1;
    } else {
      nextRules = rules.map(function (rule) {
        return rule.id === nextRule.id ? nextRule : rule;
      });
    }

    if (elements.saveButton) elements.saveButton.disabled = true;
    saveRules(
      t(modalMode === "create" ? "ruleCreated" : "ruleSaved"),
      nextRules,
      function () {
        if (elements.saveButton) elements.saveButton.disabled = false;
        ruleModalSnapshot = getRuleFormSnapshot();
        closeRuleModal();
      },
      function () {
        if (elements.saveButton) elements.saveButton.disabled = false;
      }
    );
  } catch (error) {
    showFieldError(error);
    setStatus(error.message, true);
  }
});

// Confirm delete
elements.confirmDeleteButton.addEventListener("click", function () {
  var action = confirmAction;

  if (action === "discard-rule") {
    closeDeleteModal();
    closeRuleModal();
    return;
  }

  if (action === "import-rules" && pendingImportedRules) {
    var importedCount = pendingImportedRules.rules.length;
    var importedRules = pendingImportedRules.rules.concat(rules);
    elements.confirmDeleteButton.disabled = true;
    saveRules(
      t("importRulesSuccess", { count: importedCount }),
      importedRules,
      function () {
        elements.confirmDeleteButton.disabled = false;
        rulePage = 1;
        closeDeleteModal();
      },
      function () {
        elements.confirmDeleteButton.disabled = false;
      }
    );
    return;
  }

  if (confirmAction === "reset-hit-stats") {
    var resetLogs = logs.filter(function (log) {
      return log.ruleId !== hitsModalRuleId;
    });
    var resetRules = rules.map(function (rule) {
      if (rule.id !== hitsModalRuleId) return rule;
      var updated = clone(rule);
      updated.stats = createEmptyStats();
      return updated;
    });
    elements.confirmDeleteButton.disabled = true;
    saveState(resetRules, resetLogs, t("statsCleared"), function () {
      elements.confirmDeleteButton.disabled = false;
      closeDeleteModal();
      closeHitsModal();
    }, function () {
      elements.confirmDeleteButton.disabled = false;
    });
    return;
  }

  if (confirmAction === "clear-logs") {
    var clearedRules = rules.map(function (rule) {
      var updated = clone(rule);
      updated.stats = { hitCount: 0, lastMatchedAt: "", lastMatchedUrl: "", lastResourceType: "" };
      return updated;
    });
    elements.confirmDeleteButton.disabled = true;
    saveState(clearedRules, [], t("logsCleared"), function () {
      elements.confirmDeleteButton.disabled = false;
      closeDeleteModal();
    }, function () {
      elements.confirmDeleteButton.disabled = false;
    });
    return;
  }

  var remainingRules = rules.filter(function (rule) {
    return rule.id !== deleteRuleId;
  });
  var remainingLogs = logs.filter(function (log) {
    return log.ruleId !== deleteRuleId;
  });

  elements.confirmDeleteButton.disabled = true;
  saveState(remainingRules, remainingLogs, t("ruleDeleted"), function () {
    elements.confirmDeleteButton.disabled = false;
    rulePage = Math.min(rulePage, Math.max(1, Math.ceil(remainingRules.length / RULES_PAGE_SIZE)));
    logPage = Math.min(logPage, Math.max(1, Math.ceil(remainingLogs.length / LOGS_PAGE_SIZE)));
    closeDeleteModal();
  }, function () {
    elements.confirmDeleteButton.disabled = false;
  });
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

  if (changes[INTERCEPTION_ENABLED_KEY]) {
    interceptionEnabled = changes[INTERCEPTION_ENABLED_KEY].newValue !== false;
    updateInterceptionUi();
  }
});

/* ================================================================
   Bootstrap
   ================================================================ */

initializeRuleSortable();

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
