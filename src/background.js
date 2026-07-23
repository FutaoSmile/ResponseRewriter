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

function updateBadgeFromRules(rules) {
  const total = getTotalHitCount(rules);
  chrome.action.setBadgeBackgroundColor({ color: "#175cd3" });
  chrome.action.setBadgeTextColor({ color: "#ffffff" });
  chrome.action.setBadgeText({ text: toBadgeText(total) });
}

function refreshBadge() {
  chrome.storage.local.get({ rules: [] }, function (result) {
    updateBadgeFromRules(result.rules);
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

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== "local" || !changes.rules) {
    return;
  }

  updateBadgeFromRules(changes.rules.newValue);
});
