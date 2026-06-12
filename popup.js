const RULES_PAGE_SIZE = 10;
const LOGS_PAGE_SIZE = 10;
const DEFAULT_LOCALE = "zh-CN";
const LOCALE_STORAGE_KEY = "locale";
const DEFAULT_THEME = "light";
const THEME_STORAGE_KEY = "theme";
const I18N = {
  "zh-CN": {
    appTitle: "ResponseRewriter",
    appHint: "配置规则精确匹配请求 URL（忽略查询参数），命中后直接替换整个响应体。命中次数实时记录，右侧日志可查看每一次拦截的原始与改写内容。",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "暗黑",
    language: "语言",
    rulesTitle: "规则列表",
    addRule: "+ 新增",
    rule: "规则",
    method: "方法",
    hits: "命中",
    status: "状态",
    actions: "操作",
    logsTitle: "拦截日志",
    clear: "清空",
    time: "时间",
    endpoint: "接口",
    prevPage: "上一页",
    nextPage: "下一页",
    ruleModalNote: "只配置请求方法、URL 和返回内容。",
    close: "关闭",
    ruleName: "规则名称",
    ruleNamePlaceholder: "例如：改写用户信息",
    requestMethod: "请求方法",
    all: "全部",
    enabled: "启用",
    urlMatch: "URL 匹配（精确匹配路径，忽略 ? 参数）",
    responseBody: "返回内容",
    responseBodyPlaceholder: "输入命中后直接返回的 JSON 响应内容",
    format: "格式化",
    save: "保存",
    deleteRule: "删除规则",
    deleteRuleNote: "删除后不可恢复。",
    deleteRuleConfirm: "确定删除这条规则吗？",
    cancel: "取消",
    confirmDelete: "确认删除",
    logDetail: "拦截详情",
    hitRecords: "命中记录",
    clearStats: "清空统计",
    newRule: "新规则",
    unnamedRule: "未命名规则",
    pageInfo: "第 {page} / {totalPages} 页，共 {totalItems} 条",
    compactPageInfo: "{page} / {totalPages}",
    ruleCount: "{count} 条",
    emptyRules: "还没有规则，点击右上角新增一条。",
    unset: "未设置",
    edit: "编辑",
    delete: "删除",
    emptyLogs: "还没有拦截日志。",
    createRuleTitle: "新增规则",
    editRuleTitle: "编辑规则",
    deleteRuleNamed: "确定删除规则\"{name}\"吗？",
    clearLogsTitle: "清空日志",
    clearLogsConfirm: "确定清空所有拦截日志吗？此操作不可恢复。",
    originalResponse: "原始响应",
    rewrittenResponse: "改写后响应",
    type: "类型",
    noHitRecords: "暂无命中记录",
    hitRecordsTitle: "{name} — 命中记录",
    ruleNameRequired: "规则名称不能为空。",
    urlRequired: "URL 匹配值不能为空。",
    emptyResponseBody: "返回内容为空，无法格式化。",
    responseBodyFormatted: "返回内容已格式化。",
    invalidJson: "返回内容不是合法 JSON，无法格式化。",
    saveFailed: "保存失败: {message}",
    savedRules: "规则已保存。",
    loadedRules: "已加载规则。",
    loadedExamples: "已加载示例规则。",
    noLogsToClear: "没有可清空的日志。",
    ruleEnabledUpdated: "规则状态已更新。",
    ruleCreated: "规则已新增。",
    ruleSaved: "规则已保存。",
    logsCleared: "日志和命中统计已清空。",
    deleteFailed: "删除失败: {message}",
    ruleDeleted: "规则已删除。",
    statsCleared: "统计已清空。"
  },
  en: {
    appTitle: "ResponseRewriter",
    appHint: "Configure rules to match request URLs exactly, ignoring query parameters. When a rule hits, the whole response body is replaced and every hit is logged.",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    rulesTitle: "Rules",
    addRule: "+ Add",
    rule: "Rule",
    method: "Method",
    hits: "Hits",
    status: "Status",
    actions: "Actions",
    logsTitle: "Intercept Logs",
    clear: "Clear",
    time: "Time",
    endpoint: "Endpoint",
    prevPage: "Previous",
    nextPage: "Next",
    ruleModalNote: "Configure only method, URL, and response body.",
    close: "Close",
    ruleName: "Rule Name",
    ruleNamePlaceholder: "Example: rewrite user profile",
    requestMethod: "Request Method",
    all: "All",
    enabled: "Enabled",
    urlMatch: "URL Match (exact path, ignores ? parameters)",
    responseBody: "Response Body",
    responseBodyPlaceholder: "Enter the JSON response body returned after a hit",
    format: "Format",
    save: "Save",
    deleteRule: "Delete Rule",
    deleteRuleNote: "This cannot be undone.",
    deleteRuleConfirm: "Delete this rule?",
    cancel: "Cancel",
    confirmDelete: "Delete",
    logDetail: "Intercept Detail",
    hitRecords: "Hit Records",
    clearStats: "Clear Stats",
    newRule: "New Rule",
    unnamedRule: "Untitled Rule",
    pageInfo: "Page {page} / {totalPages}, {totalItems} total",
    compactPageInfo: "{page} / {totalPages}",
    ruleCount: "{count} rules",
    emptyRules: "No rules yet. Add one from the top right.",
    unset: "Unset",
    edit: "Edit",
    delete: "Delete",
    emptyLogs: "No intercept logs yet.",
    createRuleTitle: "Add Rule",
    editRuleTitle: "Edit Rule",
    deleteRuleNamed: "Delete rule \"{name}\"?",
    clearLogsTitle: "Clear Logs",
    clearLogsConfirm: "Clear all intercept logs? This cannot be undone.",
    originalResponse: "Original Response",
    rewrittenResponse: "Rewritten Response",
    type: "Type",
    noHitRecords: "No hit records.",
    hitRecordsTitle: "{name} — Hit Records",
    ruleNameRequired: "Rule name is required.",
    urlRequired: "URL match value is required.",
    emptyResponseBody: "Response body is empty and cannot be formatted.",
    responseBodyFormatted: "Response body formatted.",
    invalidJson: "Response body is not valid JSON.",
    saveFailed: "Save failed: {message}",
    savedRules: "Rules saved.",
    loadedRules: "Rules loaded.",
    loadedExamples: "Example rules loaded.",
    noLogsToClear: "There are no logs to clear.",
    ruleEnabledUpdated: "Rule status updated.",
    ruleCreated: "Rule added.",
    ruleSaved: "Rule saved.",
    logsCleared: "Logs and hit stats cleared.",
    deleteFailed: "Delete failed: {message}",
    ruleDeleted: "Rule deleted.",
    statsCleared: "Stats cleared."
  },
  ja: {
    appTitle: "ResponseRewriter",
    appHint: "リクエスト URL を正確に照合し、クエリパラメータを無視します。命中時はレスポンス本文全体を置き換え、各命中を記録します。",
    theme: "テーマ",
    themeLight: "ライト",
    themeDark: "ダーク",
    language: "言語",
    rulesTitle: "ルール一覧",
    addRule: "+ 追加",
    rule: "ルール",
    method: "メソッド",
    hits: "命中",
    status: "状態",
    actions: "操作",
    logsTitle: "インターセプトログ",
    clear: "クリア",
    time: "時間",
    endpoint: "エンドポイント",
    prevPage: "前へ",
    nextPage: "次へ",
    ruleModalNote: "リクエストメソッド、URL、レスポンス本文のみを設定します。",
    close: "閉じる",
    ruleName: "ルール名",
    ruleNamePlaceholder: "例: ユーザー情報を書き換え",
    requestMethod: "リクエストメソッド",
    all: "すべて",
    enabled: "有効",
    urlMatch: "URL マッチ（パスを正確に照合、? パラメータは無視）",
    responseBody: "レスポンス本文",
    responseBodyPlaceholder: "命中後に返す JSON レスポンス本文を入力",
    format: "整形",
    save: "保存",
    deleteRule: "ルールを削除",
    deleteRuleNote: "この操作は元に戻せません。",
    deleteRuleConfirm: "このルールを削除しますか？",
    cancel: "キャンセル",
    confirmDelete: "削除",
    logDetail: "インターセプト詳細",
    hitRecords: "命中記録",
    clearStats: "統計をクリア",
    newRule: "新規ルール",
    unnamedRule: "無題のルール",
    pageInfo: "{page} / {totalPages} ページ、全 {totalItems} 件",
    compactPageInfo: "{page} / {totalPages}",
    ruleCount: "{count} 件",
    emptyRules: "ルールはまだありません。右上から追加してください。",
    unset: "未設定",
    edit: "編集",
    delete: "削除",
    emptyLogs: "インターセプトログはまだありません。",
    createRuleTitle: "ルールを追加",
    editRuleTitle: "ルールを編集",
    deleteRuleNamed: "ルール「{name}」を削除しますか？",
    clearLogsTitle: "ログをクリア",
    clearLogsConfirm: "すべてのインターセプトログをクリアしますか？この操作は元に戻せません。",
    originalResponse: "元のレスポンス",
    rewrittenResponse: "書き換え後のレスポンス",
    type: "タイプ",
    noHitRecords: "命中記録はありません。",
    hitRecordsTitle: "{name} — 命中記録",
    ruleNameRequired: "ルール名は必須です。",
    urlRequired: "URL マッチ値は必須です。",
    emptyResponseBody: "レスポンス本文が空のため整形できません。",
    responseBodyFormatted: "レスポンス本文を整形しました。",
    invalidJson: "レスポンス本文は有効な JSON ではありません。",
    saveFailed: "保存に失敗しました: {message}",
    savedRules: "ルールを保存しました。",
    loadedRules: "ルールを読み込みました。",
    loadedExamples: "サンプルルールを読み込みました。",
    noLogsToClear: "クリアできるログはありません。",
    ruleEnabledUpdated: "ルール状態を更新しました。",
    ruleCreated: "ルールを追加しました。",
    ruleSaved: "ルールを保存しました。",
    logsCleared: "ログと命中統計をクリアしました。",
    deleteFailed: "削除に失敗しました: {message}",
    ruleDeleted: "ルールを削除しました。",
    statsCleared: "統計をクリアしました。"
  },
  ko: {
    appTitle: "ResponseRewriter",
    appHint: "요청 URL을 정확히 매칭하고 쿼리 파라미터는 무시합니다. 명중하면 전체 응답 본문을 교체하고 모든 명중 기록을 저장합니다.",
    theme: "테마",
    themeLight: "라이트",
    themeDark: "다크",
    language: "언어",
    rulesTitle: "규칙 목록",
    addRule: "+ 추가",
    rule: "규칙",
    method: "메서드",
    hits: "명중",
    status: "상태",
    actions: "작업",
    logsTitle: "인터셉트 로그",
    clear: "비우기",
    time: "시간",
    endpoint: "엔드포인트",
    prevPage: "이전",
    nextPage: "다음",
    ruleModalNote: "요청 메서드, URL, 응답 본문만 설정합니다.",
    close: "닫기",
    ruleName: "규칙 이름",
    ruleNamePlaceholder: "예: 사용자 정보 수정",
    requestMethod: "요청 메서드",
    all: "전체",
    enabled: "사용",
    urlMatch: "URL 매칭 (경로 정확히 매칭, ? 파라미터 무시)",
    responseBody: "응답 본문",
    responseBodyPlaceholder: "명중 후 반환할 JSON 응답 본문을 입력하세요",
    format: "포맷",
    save: "저장",
    deleteRule: "규칙 삭제",
    deleteRuleNote: "이 작업은 되돌릴 수 없습니다.",
    deleteRuleConfirm: "이 규칙을 삭제할까요?",
    cancel: "취소",
    confirmDelete: "삭제",
    logDetail: "인터셉트 상세",
    hitRecords: "명중 기록",
    clearStats: "통계 비우기",
    newRule: "새 규칙",
    unnamedRule: "이름 없는 규칙",
    pageInfo: "{page} / {totalPages} 페이지, 총 {totalItems}개",
    compactPageInfo: "{page} / {totalPages}",
    ruleCount: "{count}개",
    emptyRules: "아직 규칙이 없습니다. 오른쪽 위에서 추가하세요.",
    unset: "미설정",
    edit: "편집",
    delete: "삭제",
    emptyLogs: "인터셉트 로그가 없습니다.",
    createRuleTitle: "규칙 추가",
    editRuleTitle: "규칙 편집",
    deleteRuleNamed: "규칙 \"{name}\"을 삭제할까요?",
    clearLogsTitle: "로그 비우기",
    clearLogsConfirm: "모든 인터셉트 로그를 비울까요? 이 작업은 되돌릴 수 없습니다.",
    originalResponse: "원본 응답",
    rewrittenResponse: "수정된 응답",
    type: "유형",
    noHitRecords: "명중 기록이 없습니다.",
    hitRecordsTitle: "{name} — 명중 기록",
    ruleNameRequired: "규칙 이름은 필수입니다.",
    urlRequired: "URL 매칭 값은 필수입니다.",
    emptyResponseBody: "응답 본문이 비어 있어 포맷할 수 없습니다.",
    responseBodyFormatted: "응답 본문을 포맷했습니다.",
    invalidJson: "응답 본문이 올바른 JSON이 아닙니다.",
    saveFailed: "저장 실패: {message}",
    savedRules: "규칙을 저장했습니다.",
    loadedRules: "규칙을 불러왔습니다.",
    loadedExamples: "예제 규칙을 불러왔습니다.",
    noLogsToClear: "비울 로그가 없습니다.",
    ruleEnabledUpdated: "규칙 상태를 업데이트했습니다.",
    ruleCreated: "규칙을 추가했습니다.",
    ruleSaved: "규칙을 저장했습니다.",
    logsCleared: "로그와 명중 통계를 비웠습니다.",
    deleteFailed: "삭제 실패: {message}",
    ruleDeleted: "규칙을 삭제했습니다.",
    statsCleared: "통계를 비웠습니다."
  }
};

/* ================================================================
   DOM References
   ================================================================ */

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
  status: document.getElementById("status"),
  ruleModal: document.getElementById("ruleModal"),
  ruleModalTitle: document.getElementById("ruleModalTitle"),
  closeRuleModalButton: document.getElementById("closeRuleModalButton"),
  deleteModal: document.getElementById("deleteModal"),
  closeDeleteModalButton: document.getElementById("closeDeleteModalButton"),
  cancelDeleteButton: document.getElementById("cancelDeleteButton"),
  confirmDeleteButton: document.getElementById("confirmDeleteButton"),
  deleteModalText: document.getElementById("deleteModalText"),
  logModal: document.getElementById("logModal"),
  closeLogModalButton: document.getElementById("closeLogModalButton"),
  logMetaText: document.getElementById("logMetaText"),
  ruleForm: document.getElementById("ruleForm"),
  ruleName: document.getElementById("ruleName"),
  ruleEnabled: document.getElementById("ruleEnabled"),
  matchMethod: document.getElementById("matchMethod"),
  urlMatchValue: document.getElementById("urlMatchValue"),
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
let rulePage = 1;
let logPage = 1;

/* ================================================================
   Utility helpers
   ================================================================ */

function createRuleId() {
  return "rule-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function t(key, params) {
  var dictionary = I18N[currentLocale] || I18N[DEFAULT_LOCALE];
  var template = dictionary[key] || I18N[DEFAULT_LOCALE][key] || key;
  params = params || {};
  return template.replace(/\{(\w+)\}/g, function (_, name) {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : "";
  });
}

function normalizeLocale(value) {
  var lang = String(value || "").toLowerCase();
  if (lang.indexOf("ja") === 0) return "ja";
  if (lang.indexOf("ko") === 0) return "ko";
  if (lang.indexOf("en") === 0) return "en";
  return "zh-CN";
}

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

  renderRuleList();
  renderLogList();
}

function createBlankRule() {
  return {
    id: createRuleId(),
    enabled: true,
    name: t("newRule"),
    match: {
      method: "",
      url: ""
    },
    rewrite: {
      body: ""
    },
    stats: {
      hitCount: 0,
      lastMatchedAt: "",
      lastMatchedUrl: "",
      lastResourceType: ""
    }
  };
}

function normalizeRule(rule, index) {
  const match = rule && rule.match && typeof rule.match === "object" ? rule.match : {};
  const rewrite = rule && rule.rewrite && typeof rule.rewrite === "object" ? rule.rewrite : {};

  return {
    id: rule && rule.id ? String(rule.id) : createRuleId() + "-" + index,
    enabled: rule ? rule.enabled !== false : true,
    name: rule && rule.name ? String(rule.name) : t("unnamedRule"),
    match: {
      method: match.method ? String(match.method).toUpperCase() : "",
      url: typeof match.url === "string"
        ? match.url
        : (match.url && typeof match.url.value === "string" ? match.url.value : "")
    },
    rewrite: {
      body: typeof rewrite.body === "string" ? rewrite.body : ""
    },
    stats: {
      hitCount: Number(rule && rule.stats && rule.stats.hitCount) || 0,
      lastMatchedAt: rule && rule.stats && rule.stats.lastMatchedAt ? String(rule.stats.lastMatchedAt) : "",
      lastMatchedUrl: rule && rule.stats && rule.stats.lastMatchedUrl ? String(rule.stats.lastMatchedUrl) : "",
      lastResourceType: rule && rule.stats && rule.stats.lastResourceType ? String(rule.stats.lastResourceType) : ""
    }
  };
}

function normalizeRules(inputRules) {
  var source = Array.isArray(inputRules) ? inputRules : [];
  return source.map(normalizeRule);
}

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
   Pagination
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
    var item = document.createElement("div");
    item.className = "rule-item";
    item.style.animationDelay = (index * 0.04) + "s";
    item.innerHTML =
      '<span class="rule-title">' + escapeHtml(rule.name) + '</span>' +
      '<span class="rule-meta">' + (rule.match.method || t("all")) + '</span>' +
      '<span class="rule-meta">' + escapeHtml(rule.match.url || t("unset")) + '</span>' +
      '<span><span class="badge hit-badge ' + (rule.stats.hitCount > 0 ? "hit" : "miss") + '" data-action="view-hits" data-rule-id="' + rule.id + '">' + String(rule.stats.hitCount) + '</span></span>' +
      '<span>' +
        '<label class="switch list-switch">' +
          '<input type="checkbox" ' + (rule.enabled ? "checked" : "") + ' data-action="toggle-enabled" data-rule-id="' + rule.id + '">' +
          '<span class="switch-slider"></span>' +
        '</label>' +
      '</span>' +
      '<span class="row-actions">' +
        '<button type="button" class="table-action" data-action="edit" data-rule-id="' + rule.id + '">' + t("edit") + '</button>' +
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
   Log list rendering
   ================================================================ */

function renderLogList() {
  elements.logList.innerHTML = "";
  if (elements.clearLogsButton) {
    elements.clearLogsButton.style.display = logs.length > 0 ? "" : "none";
  }
  var paged = getPageItems(logs, logPage, LOGS_PAGE_SIZE);
  logPage = paged.page;

  if (!logs.length) {
    var empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("emptyLogs");
    elements.logList.appendChild(empty);
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

function fillRuleForm(rule) {
  elements.ruleName.value = rule.name;
  elements.ruleEnabled.checked = rule.enabled;
  elements.matchMethod.value = rule.match.method;
  elements.urlMatchValue.value = rule.match.url;
  if (elements.rewriteBody) {
    elements.rewriteBody.value = rule.rewrite.body;
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

function openDeleteModal(rule) {
  deleteRuleId = rule.id;
  confirmAction = "delete-rule";
  elements.deleteModalText.textContent = t("deleteRuleNamed", { name: rule.name });
  elements.deleteModal.classList.remove("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "false");
}

function openClearLogsConfirm() {
  confirmAction = "clear-logs";
  elements.deleteModalText.textContent = t("clearLogsConfirm");
  elements.deleteModal.querySelector("h2").textContent = t("clearLogsTitle");
  elements.deleteModal.classList.remove("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  deleteRuleId = "";
  confirmAction = "";
  elements.deleteModal.querySelector("h2").textContent = t("deleteRule");
  elements.deleteModal.classList.add("hidden");
  elements.deleteModal.setAttribute("aria-hidden", "true");
}

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
  var ruleLogs = logs.filter(function (l) { return l.ruleId === rule.id; });
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
          '<span>' + escapeHtml(l.resourceType || "-") + '</span>' +
        '</div>';
      var detail = document.createElement("div");
      detail.className = "hit-detail hidden";
      detail.innerHTML = renderLogDetailHTML(l.originalResponse, l.rewrittenResponse);
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
    if (!hitsModalRuleId) return;
    rules = rules.map(function (r) {
      if (r.id !== hitsModalRuleId) return r;
      var updated = clone(r);
      updated.stats = { hitCount: 0, lastMatchedAt: "", lastMatchedUrl: "", lastResourceType: "" };
      return updated;
    });
    saveRules(t("statsCleared"));
    closeHitsModal();
  });
}

/* ================================================================
   Validation
   ================================================================ */

function validateRule(rule) {
  if (!rule.name.trim()) {
    throw new Error(t("ruleNameRequired"));
  }
  if (!rule.match.url.trim()) {
    throw new Error(t("urlRequired"));
  }
}

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
      url: elements.urlMatchValue.value.trim()
    },
    rewrite: {
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
    logPage = Math.min(logPage, Math.max(1, Math.ceil(logs.length / LOGS_PAGE_SIZE)));
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
