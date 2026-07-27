function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(currentLocale, { hour12: false });
}

function escapeMultilineText(text) {
  return typeof text === "string" ? text : "";
}

function getPageItems(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages
  };
}

function getRuleLogs(items, ruleId) {
  return items.filter(function (log) {
    return log.ruleId === ruleId;
  });
}

function getFilteredLogs() {
  var keyword = logFilters.keyword.trim().toLowerCase();
  var resourceType = logFilters.resourceType.trim().toLowerCase();

  return logs.filter(function (log) {
    if (resourceType && String(log.resourceType || "").toLowerCase() !== resourceType) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [log.url, log.ruleName, log.method, log.resourceType].some(function (value) {
      return String(value || "").toLowerCase().indexOf(keyword) !== -1;
    });
  });
}

function syncLogFilterInputs() {
  if (elements.logSearchInput) {
    elements.logSearchInput.value = logFilters.keyword;
  }
  if (elements.logTypeFilter) {
    elements.logTypeFilter.value = logFilters.resourceType;
  }
}

function updateLogFiltersFromInputs() {
  logFilters.keyword = elements.logSearchInput ? elements.logSearchInput.value : "";
  logFilters.resourceType = elements.logTypeFilter ? elements.logTypeFilter.value : "";
  logPage = 1;
  renderLogList();
}

/* ================================================================
   Toast notification system
   ================================================================ */


function renderPagination(infoElement, prevButton, nextButton, currentPage, totalPages, totalItems, compact) {
  var hasItems = totalItems > 0;
  var displayPage = hasItems ? currentPage : 0;
  var displayTotalPages = hasItems ? totalPages : 0;
  infoElement.textContent = compact
    ? t("compactPageInfo", { page: displayPage, totalPages: displayTotalPages })
    : t("pageInfo", { page: displayPage, totalPages: displayTotalPages, totalItems: totalItems });
  prevButton.disabled = !hasItems || currentPage <= 1;
  nextButton.disabled = !hasItems || currentPage >= totalPages;
}

/* ================================================================
   Rule list rendering (with staggered animation)
   ================================================================ */


function renderLogList() {
  elements.logList.innerHTML = "";
  syncLogFilterInputs();
  if (elements.clearLogsButton) {
    elements.clearLogsButton.style.display = logs.length > 0 ? "" : "none";
  }

  var filteredLogs = getFilteredLogs();
  var paged = getPageItems(filteredLogs, logPage, LOGS_PAGE_SIZE);
  logPage = paged.page;

  if (!logs.length) {
    var empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("emptyLogs");
    elements.logList.appendChild(empty);
    renderPagination(elements.logPageInfo, elements.logPrevPageButton, elements.logNextPageButton, 1, 1, 0, true);
    return;
  }

  if (!filteredLogs.length) {
    var filteredEmpty = document.createElement("div");
    filteredEmpty.className = "empty-state";
    filteredEmpty.textContent = t("emptyFilteredLogs");
    elements.logList.appendChild(filteredEmpty);
    renderPagination(elements.logPageInfo, elements.logPrevPageButton, elements.logNextPageButton, 1, 1, 0, true);
    return;
  }

  paged.items.forEach(function (log, index) {
    var card = document.createElement("div");
    card.className = "log-card" + (log.outcome === "xhr-passthrough" ? " is-warning" : "");
    card.style.animationDelay = (index * 0.04) + "s";
    card.dataset.logId = log.id;
    card.innerHTML =
      '<div class="log-card-url">' + escapeHtml(log.url || "-") + '</div>' +
      '<div class="log-card-meta">' +
        '<span>' + escapeHtml(log.method || "-") + '</span>' +
        renderLogOutcomeBadge(log) +
        '<span class="sep"></span>' +
        '<span>' + escapeHtml(log.ruleName || "-") + '</span>' +
        '<span class="sep"></span>' +
        '<span>' + formatDate(log.matchedAt) + '</span>' +
      '</div>';
    elements.logList.appendChild(card);
  });

  renderPagination(
    elements.logPageInfo,
    elements.logPrevPageButton,
    elements.logNextPageButton,
    paged.page,
    paged.totalPages,
    logs.length,
    true
  );
}

/* ================================================================
   Stats rendering
   ================================================================ */

/* ================================================================
   Form population
   ================================================================ */


function formatResponseForDiff(value) {
  var text = typeof value === "string" ? value : "";
  var trimmed = text.trim();
  if (/^[\[{]/.test(trimmed)) {
    try {
      // Canonical formatting prevents indentation-only JSON differences from being
      // highlighted as response changes.
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch (error) {
      // Fall through and compare the original text.
    }
  }
  return text.replace(/\r\n?/g, "\n");
}

function createLineDiff(original, rewritten) {
  var originalLines = formatResponseForDiff(original).split("\n");
  var rewrittenLines = formatResponseForDiff(rewritten).split("\n");
  var rows = [];
  var addedCount = 0;
  var removedCount = 0;

  // LCS uses O(left * right) memory and time. Large, line-heavy responses fall back
  // to positional comparison so opening a detail modal cannot freeze the manager.
  if (originalLines.length * rewrittenLines.length > 640000) {
    var maxLength = Math.max(originalLines.length, rewrittenLines.length);
    for (var lineIndex = 0; lineIndex < maxLength; lineIndex += 1) {
      var originalLine = lineIndex < originalLines.length ? originalLines[lineIndex] : null;
      var rewrittenLine = lineIndex < rewrittenLines.length ? rewrittenLines[lineIndex] : null;
      var unchanged = originalLine !== null && originalLine === rewrittenLine;
      if (!unchanged && originalLine !== null) removedCount += 1;
      if (!unchanged && rewrittenLine !== null) addedCount += 1;
      rows.push({
        original: originalLine,
        originalNumber: originalLine === null ? null : lineIndex + 1,
        rewritten: rewrittenLine,
        rewrittenNumber: rewrittenLine === null ? null : lineIndex + 1,
        changed: !unchanged
      });
    }
    return { rows: rows, addedCount: addedCount, removedCount: removedCount };
  }

  // Build a longest-common-subsequence matrix. Uint16Array keeps this bounded diff
  // substantially smaller than a matrix of regular JavaScript numbers.
  var matrix = Array.from({ length: originalLines.length + 1 }, function () {
    return new Uint16Array(rewrittenLines.length + 1);
  });
  var originalIndex;
  var rewrittenIndex;

  for (originalIndex = originalLines.length - 1; originalIndex >= 0; originalIndex -= 1) {
    for (rewrittenIndex = rewrittenLines.length - 1; rewrittenIndex >= 0; rewrittenIndex -= 1) {
      matrix[originalIndex][rewrittenIndex] = originalLines[originalIndex] === rewrittenLines[rewrittenIndex]
        ? matrix[originalIndex + 1][rewrittenIndex + 1] + 1
        : Math.max(matrix[originalIndex + 1][rewrittenIndex], matrix[originalIndex][rewrittenIndex + 1]);
    }
  }

  // Walk the matrix to recover equal/add/remove operations and their original line
  // numbers. Counts are based on operations, not rendered alignment rows.
  var operations = [];
  originalIndex = 0;
  rewrittenIndex = 0;
  while (originalIndex < originalLines.length || rewrittenIndex < rewrittenLines.length) {
    if (
      originalIndex < originalLines.length &&
      rewrittenIndex < rewrittenLines.length &&
      originalLines[originalIndex] === rewrittenLines[rewrittenIndex]
    ) {
      operations.push({
        type: "equal",
        text: originalLines[originalIndex],
        originalNumber: originalIndex + 1,
        rewrittenNumber: rewrittenIndex + 1
      });
      originalIndex += 1;
      rewrittenIndex += 1;
    } else if (
      originalIndex < originalLines.length &&
      (
        rewrittenIndex >= rewrittenLines.length ||
        matrix[originalIndex + 1][rewrittenIndex] >= matrix[originalIndex][rewrittenIndex + 1]
      )
    ) {
      operations.push({
        type: "remove",
        text: originalLines[originalIndex],
        originalNumber: originalIndex + 1
      });
      originalIndex += 1;
      removedCount += 1;
    } else {
      operations.push({
        type: "add",
        text: rewrittenLines[rewrittenIndex],
        rewrittenNumber: rewrittenIndex + 1
      });
      rewrittenIndex += 1;
      addedCount += 1;
    }
  }

  var removedLines = [];
  var addedLines = [];
  function flushChangedLines() {
    // Pair adjacent removals and additions into the same visual row. This turns a
    // changed JSON property into an intuitive left-versus-right comparison.
    var count = Math.max(removedLines.length, addedLines.length);
    for (var index = 0; index < count; index += 1) {
      var removed = removedLines[index] || null;
      var added = addedLines[index] || null;
      rows.push({
        original: removed ? removed.text : null,
        originalNumber: removed ? removed.originalNumber : null,
        rewritten: added ? added.text : null,
        rewrittenNumber: added ? added.rewrittenNumber : null,
        changed: true
      });
    }
    removedLines = [];
    addedLines = [];
  }

  operations.forEach(function (operation) {
    if (operation.type === "remove") {
      removedLines.push(operation);
      return;
    }
    if (operation.type === "add") {
      addedLines.push(operation);
      return;
    }
    flushChangedLines();
    rows.push({
      original: operation.text,
      originalNumber: operation.originalNumber,
      rewritten: operation.text,
      rewrittenNumber: operation.rewrittenNumber,
      changed: false
    });
  });
  flushChangedLines();

  return { rows: rows, addedCount: addedCount, removedCount: removedCount };
}

function renderDiffCell(side, text, lineNumber, changed) {
  var stateClass = text === null ? " is-empty" : (changed ? " is-" + side : "");
  // Response data is untrusted page content; escape it before inserting the diff HTML.
  return '<div class="diff-cell' + stateClass + '" role="cell">' +
    '<span class="diff-line-number">' + (lineNumber === null ? "" : lineNumber) + '</span>' +
    '<code>' + (text === null ? "" : escapeHtml(text || " ")) + '</code>' +
    '</div>';
}

function renderLogOutcomeBadge(log) {
  if (!log || log.outcome === "rewritten" || !log.outcome) {
    return "";
  }

  var isPassthrough = log.outcome === "xhr-passthrough";
  return '<span class="log-outcome-badge ' + (isPassthrough ? "is-warning" : "is-success") + '">' +
    t(isPassthrough ? "logOutcomeXhrPassthrough" : "logOutcomeMockFetch") +
    '</span>';
}

function renderLogOutcomeNotice(outcome) {
  if (outcome !== "mock-fetch" && outcome !== "xhr-passthrough") {
    return "";
  }

  var isPassthrough = outcome === "xhr-passthrough";
  return '<div class="log-outcome-notice ' + (isPassthrough ? "is-warning" : "is-success") + '">' +
    '<strong>' + t(isPassthrough ? "logOutcomeXhrPassthrough" : "logOutcomeMockFetch") + '</strong>' +
    '<span>' + t(isPassthrough ? "logNoticeXhrPassthrough" : "logNoticeMockFetch") + '</span>' +
    '</div>';
}

/* Shared log detail renderer — used by log modal & hits modal */
function renderLogDetailHTML(original, rewritten, outcome) {
  var diff = createLineDiff(original, rewritten);
  var hasChanges = diff.addedCount > 0 || diff.removedCount > 0;
  var rows = diff.rows.map(function (row) {
    return '<div class="diff-row' + (row.changed ? " is-changed" : "") + '" role="row">' +
      renderDiffCell("removed", row.original, row.originalNumber, row.changed) +
      renderDiffCell("added", row.rewritten, row.rewrittenNumber, row.changed) +
      '</div>';
  }).join("");

  return '<section class="response-diff" data-log-detail>' +
    renderLogOutcomeNotice(outcome) +
    '<div class="diff-summary">' +
      '<strong>' + t(hasChanges ? "diffChanged" : "diffNoChanges") + '</strong>' +
      '<div class="diff-stats">' +
        '<span class="diff-stat is-removed">' + t("diffRemoved", { count: diff.removedCount }) + '</span>' +
        '<span class="diff-stat is-added">' + t("diffAdded", { count: diff.addedCount }) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="diff-table" role="table">' +
      '<div class="diff-columns" role="row">' +
        '<div role="columnheader">' + t(outcome === "mock-fetch" ? "serverNotRequested" : "originalResponse") + '</div>' +
        '<div role="columnheader">' + t(outcome === "mock-fetch" ? "directResponse" : "rewrittenResponse") + '</div>' +
      '</div>' +
      rows +
    '</div>' +
    '</section>';
}

function openLogModal(log) {
  var metaBar = document.getElementById("logMetaBar");
  if (metaBar) {
    metaBar.innerHTML =
      '<span class="log-meta-tag">' + t("time") + ' <strong>' + formatDate(log.matchedAt) + '</strong></span>' +
      '<span class="log-meta-tag">' + t("method") + ' <strong>' + escapeHtml(log.method || "-") + '</strong></span>' +
      '<span class="log-meta-tag">' + t("type") + ' <strong>' + escapeHtml(log.resourceType || "-") + '</strong></span>' +
      renderLogOutcomeBadge(log) +
      '<span class="log-meta-tag log-meta-tag-url" title="' + escapeHtml(log.url || "") + '">URL <strong>' + escapeHtml(log.url || "-") + '</strong></span>';
  } else {
    elements.logMetaText.textContent =
      [formatDate(log.matchedAt), log.method || "-", log.url || "-", log.resourceType || "-"].join(" | ");
  }
  var currentDetail = elements.logModal.querySelector("[data-log-detail]");
  if (currentDetail) currentDetail.remove();
  elements.logModal.querySelector(".modal-card").insertAdjacentHTML(
    "beforeend",
    renderLogDetailHTML(log.originalResponse, log.rewrittenResponse, log.outcome)
  );
  elements.logModal.classList.remove("hidden");
  elements.logModal.setAttribute("aria-hidden", "false");
}

function closeLogModal() {
  elements.logModal.classList.add("hidden");
  elements.logModal.setAttribute("aria-hidden", "true");
}
