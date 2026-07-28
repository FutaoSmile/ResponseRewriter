(function () {
  // Content scripts run in Chrome's isolated world. The interceptor must be injected
  // into the page world to replace that page's XMLHttpRequest and fetch functions.
  const MAX_LOGS = 100;
  const MAX_RESPONSE_LENGTH = 20000;
  const INTERCEPTION_ENABLED_KEY = "interceptionEnabled";
  const PRIVACY_CONSENT_KEY = "privacyConsentVersion";
  const REQUIRED_PRIVACY_CONSENT_VERSION = 1;
  const BOOTSTRAP_REQUEST_EVENT = "response-rewriter:bootstrap-request";
  const BOOTSTRAP_RESPONSE_EVENT = "response-rewriter:bootstrap-response";
  let rulesEvent = "";
  let hitEvent = "";
  let openManagerEvent = "";

  function createRuleId() {
    return "rule-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeRule(rule, index) {
    // Rules may come from older storage/export formats, including the retired
    // match.domain field. Normalize at the bridge and omit that field so legacy
    // rules no longer retain a hidden site restriction in the page world.
    const match = rule && rule.match && typeof rule.match === "object" ? rule.match : {};
    const rewrite = rule && rule.rewrite && typeof rule.rewrite === "object" ? rule.rewrite : {};

    return {
      id: rule && rule.id ? String(rule.id) : createRuleId() + "-" + index,
      enabled: rule ? rule.enabled !== false : true,
      name: rule && rule.name ? String(rule.name) : "未命名规则",
      match: {
        method: match.method ? String(match.method).toUpperCase() : "",
        urlMode: match.urlMode === "contains" || match.urlMode === "regex"
          ? match.urlMode
          : "exact",
        url: typeof match.url === "string"
          ? match.url
          : (match.url && typeof match.url.value === "string" ? match.url.value : "")
      },
      rewrite: {
        mode: rewrite.mode === "json-merge" || rewrite.mode === "script" || rewrite.mode === "mock-fetch"
          ? rewrite.mode
          : "replace",
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

  function normalizeRules(rules) {
    var source = Array.isArray(rules) ? rules : [];
    return source.map(normalizeRule);
  }

  function truncateText(value) {
    if (typeof value !== "string") {
      return "";
    }

    if (value.length <= MAX_RESPONSE_LENGTH) {
      return value;
    }

    // Logs live in chrome.storage.local and are rendered in the manager. Bounding
    // each response prevents a few large API calls from exhausting storage or UI memory.
    return value.slice(0, MAX_RESPONSE_LENGTH) + "\n\n[truncated]";
  }

  function sendRulesToPage(rules, interceptionEnabled, privacyConsentGranted) {
    if (!rulesEvent) return;
    window.dispatchEvent(new CustomEvent(rulesEvent, {
      detail: JSON.stringify({
        rules: rules,
        interceptionEnabled: interceptionEnabled !== false,
        privacyConsentGranted: privacyConsentGranted === true
      })
    }));
  }

  function loadRulesAndSync() {
    chrome.storage.local.get({
      rules: [],
      [INTERCEPTION_ENABLED_KEY]: true,
      [PRIVACY_CONSENT_KEY]: 0
    }, function (result) {
      if (result[PRIVACY_CONSENT_KEY] !== REQUIRED_PRIVACY_CONSENT_VERSION) {
        sendRulesToPage([], false, false);
        return;
      }

      const normalized = normalizeRules(result.rules);
      sendRulesToPage(normalized, result[INTERCEPTION_ENABLED_KEY], true);
    });
  }

  function recordRuleHit(hit) {
    if (!hit || !hit.ruleId) {
      return;
    }

    // Keep statistics and the corresponding log entry in one storage write so the
    // manager never observes a hit count without its detail record (or vice versa).
    chrome.storage.local.get({
      rules: [],
      logs: [],
      [PRIVACY_CONSENT_KEY]: 0
    }, function (result) {
      if (result[PRIVACY_CONSENT_KEY] !== REQUIRED_PRIVACY_CONSENT_VERSION) {
        return;
      }

      const rules = normalizeRules(result.rules);
      const matchedRule = rules.find(function (rule) {
        return rule.id === hit.ruleId;
      });

      if (!matchedRule) {
        return;
      }

      const nextRules = rules.map(function (rule) {
        if (rule.id !== hit.ruleId) {
          return rule;
        }

        return Object.assign({}, rule, {
          stats: {
            hitCount: (Number(rule.stats.hitCount) || 0) + 1,
            lastMatchedAt: hit.matchedAt || new Date().toISOString(),
            lastMatchedUrl: hit.url || "",
            lastResourceType: hit.resourceType || ""
          }
        });
      });

      const originalResponse = typeof hit.originalResponse === "string" ? hit.originalResponse : "";
      const rewrittenResponse = typeof hit.rewrittenResponse === "string" ? hit.rewrittenResponse : "";
      const nextLogs = [
        {
          id: "log-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
          ruleId: hit.ruleId,
          ruleName: hit.ruleName || "",
          matchedAt: hit.matchedAt || new Date().toISOString(),
          url: hit.url || "",
          method: hit.method || "",
          resourceType: hit.resourceType || "",
          outcome: hit.outcome || "rewritten",
          errorMessage: hit.errorMessage || "",
          originalResponse: truncateText(originalResponse),
          rewrittenResponse: truncateText(rewrittenResponse),
          originalResponseLength: originalResponse.length,
          rewrittenResponseLength: rewrittenResponse.length,
          originalResponseTruncated: originalResponse.length > MAX_RESPONSE_LENGTH,
          rewrittenResponseTruncated: rewrittenResponse.length > MAX_RESPONSE_LENGTH
        }
      ].concat(Array.isArray(result.logs) ? result.logs : []).slice(0, MAX_LOGS);

      chrome.storage.local.set({ rules: nextRules, logs: nextLogs }, function () {
        if (chrome.runtime.lastError) {
          // The page request has already completed, so storage cannot be retried
          // safely here. Surface the failure instead of silently losing the hit.
          console.error("ResponseRewriter could not save the intercept log:", chrome.runtime.lastError.message);
        }
      });
    });
  }

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local" ||
        (!changes.rules && !changes[INTERCEPTION_ENABLED_KEY] && !changes[PRIVACY_CONSENT_KEY])) {
      return;
    }

    loadRulesAndSync();
  });

  window.addEventListener(BOOTSTRAP_RESPONSE_EVENT, function (event) {
    var channelId = typeof event.detail === "string" ? event.detail : "";
    if (!/^[0-9a-f-]{36}$/i.test(channelId)) return;

    rulesEvent = "response-rewriter:" + channelId + ":rules";
    hitEvent = "response-rewriter:" + channelId + ":hit";
    openManagerEvent = "response-rewriter:" + channelId + ":open-manager";

    window.addEventListener(hitEvent, function (hitEventData) {
      try {
        recordRuleHit(JSON.parse(hitEventData.detail || "{}"));
      } catch (error) {
        console.error("ResponseRewriter ignored an invalid intercept event.");
      }
    });

    window.addEventListener(openManagerEvent, function () {
      chrome.runtime.sendMessage({ type: "OPEN_MANAGER" });
    });

    loadRulesAndSync();
  }, { once: true });

  // Both scripts are declared at document_start with the MAIN-world bootstrap first.
  // The one-time handshake completes before website scripts can observe its public
  // event names; all rule and log traffic then uses the random per-frame channel.
  window.dispatchEvent(new CustomEvent(BOOTSTRAP_REQUEST_EVENT));
})();
