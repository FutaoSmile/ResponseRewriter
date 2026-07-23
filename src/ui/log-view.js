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
    card.className = "log-card";
    card.style.animationDelay = (index * 0.04) + "s";
    card.dataset.logId = log.id;
    card.innerHTML =
      '<div class="log-card-url">' + escapeHtml(log.url || "-") + '</div>' +
      '<div class="log-card-meta">' +
        '<span>' + escapeHtml(log.method || "-") + '</span>' +
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


function highlightJson(text) {
  if (!text) return "";
  var trimmed = text.trim();
  if (!/^[\[{]/.test(trimmed)) return escapeHtml(text);
  try {
    var parsed = JSON.parse(trimmed);
    var formatted = JSON.stringify(parsed, null, 2);
    return formatted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/("(?:\\.|[^"\\])*?")\s*:/g, '<span class="hl-key">$1</span>:')
      .replace(/:\s*("(?:\\.|[^"\\])*?")/g, ': <span class="hl-string">$1</span>')
      .replace(/:\s*(true|false)\b/g, ': <span class="hl-bool">$1</span>')
      .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, ': <span class="hl-num">$1</span>')
      .replace(/:\s*(null)\b/g, ': <span class="hl-null">$1</span>');
  } catch (e) {
    return escapeHtml(text);
  }
}

/* Shared log detail renderer — used by log modal & hits modal */
function renderLogDetailHTML(original, rewritten) {
  return '<div class="log-detail-grid">' +
    '<section class="detail-block"><h3>' + t("originalResponse") + '</h3><pre class="detail-response">' + highlightJson(original || "") + '</pre></section>' +
    '<section class="detail-block"><h3>' + t("rewrittenResponse") + '</h3><pre class="detail-response">' + highlightJson(rewritten || "") + '</pre></section>' +
    '</div>';
}

function openLogModal(log) {
  var metaBar = document.getElementById("logMetaBar");
  if (metaBar) {
    metaBar.innerHTML =
      '<span class="log-meta-tag">' + t("time") + ' <strong>' + formatDate(log.matchedAt) + '</strong></span>' +
      '<span class="log-meta-tag">' + t("method") + ' <strong>' + escapeHtml(log.method || "-") + '</strong></span>' +
      '<span class="log-meta-tag">' + t("type") + ' <strong>' + escapeHtml(log.resourceType || "-") + '</strong></span>' +
      '<span class="log-meta-tag log-meta-tag-url" title="' + escapeHtml(log.url || "") + '">URL <strong>' + escapeHtml(log.url || "-") + '</strong></span>';
  } else {
    elements.logMetaText.textContent =
      [formatDate(log.matchedAt), log.method || "-", log.url || "-", log.resourceType || "-"].join(" | ");
  }
  var logGrid = elements.logModal.querySelector(".log-detail-grid");
  if (logGrid) logGrid.remove();
  elements.logModal.querySelector(".modal-card").insertAdjacentHTML("beforeend", renderLogDetailHTML(log.originalResponse, log.rewrittenResponse));
  elements.logModal.classList.remove("hidden");
  elements.logModal.setAttribute("aria-hidden", "false");
}

function closeLogModal() {
  elements.logModal.classList.add("hidden");
  elements.logModal.setAttribute("aria-hidden", "true");
}
