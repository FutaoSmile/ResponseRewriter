importScripts("default-data.js");

function normalizeRules(rules) {
  return Array.isArray(rules) ? rules : [];
}

function getTotalHitCount(rules) {
  return normalizeRules(rules).reduce(function (total, rule) {
    return total + (Number(rule && rule.stats && rule.stats.hitCount) || 0);
  }, 0);
}

function toBadgeText(count) {
  if (count <= 0) {
    return "";
  }

  if (count > 999) {
    return "999+";
  }

  return String(count);
}

function updateBadgeFromRules(rules, interceptionEnabled) {
  const total = getTotalHitCount(rules);
  const paused = interceptionEnabled === false;
  chrome.action.setBadgeBackgroundColor({ color: paused ? "#64748b" : "#175cd3" });
  chrome.action.setBadgeTextColor({ color: "#ffffff" });
  chrome.action.setBadgeText({ text: paused ? "OFF" : toBadgeText(total) });
  chrome.action.setTitle({ title: paused ? "ResponseRewriter · Paused" : "ResponseRewriter" });
}

function refreshBadge() {
  chrome.storage.local.get({ rules: [], interceptionEnabled: true }, function (result) {
    updateBadgeFromRules(result.rules, result.interceptionEnabled);
  });
}

function handleInstalled(details) {
  if (!details || details.reason !== "install") {
    refreshBadge();
    return;
  }

  // Installation defaults are only written for missing keys. This keeps unpacked
  // reloads and unusual restored profiles from losing data that already exists.
  chrome.storage.local.get({ rules: null, logs: null }, function (result) {
    var defaults = {};
    if (!Array.isArray(result.rules)) {
      defaults.rules = ResponseRewriterDefaults.createRules();
    }
    if (!Array.isArray(result.logs)) {
      defaults.logs = ResponseRewriterDefaults.createLogs();
    }

    if (!Object.keys(defaults).length) {
      refreshBadge();
      return;
    }

    chrome.storage.local.set(defaults, refreshBadge);
  });
}

chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL("src/ui/manager.html")
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  if (!message || message.type !== "OPEN_MANAGER") {
    return;
  }

  chrome.tabs.create({
    url: chrome.runtime.getURL("src/ui/manager.html")
  });
});

chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.runtime.onStartup.addListener(refreshBadge);

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== "local" || (!changes.rules && !changes.interceptionEnabled)) {
    return;
  }

  refreshBadge();
});
