(function () {
  const SOURCE = "response-rewriter-extension";
  const PAGE_SOURCE = "response-rewriter-page";
  const MAX_LOGS = 100;
  const MAX_RESPONSE_LENGTH = 20000;

  function createRuleId() {
    return "rule-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeRule(rule, index) {
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
        mode: rewrite.mode === "json-merge" || rewrite.mode === "script"
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

    return value.slice(0, MAX_RESPONSE_LENGTH) + "\n\n[truncated]";
  }

  function injectPageScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/injected.js");
    script.onload = function () {
      script.remove();
    };
    (document.documentElement || document.head || document.body).appendChild(script);
  }

  function sendRulesToPage(rules) {
    window.postMessage(
      {
        source: SOURCE,
        type: "SET_RULES",
        rules: rules
      },
      "*"
    );
  }

  function loadRulesAndSync() {
    chrome.storage.local.get({ rules: [] }, function (result) {
      const normalized = normalizeRules(result.rules);
      sendRulesToPage(normalized);
    });
  }

  function recordRuleHit(hit) {
    if (!hit || !hit.ruleId) {
      return;
    }

    chrome.storage.local.get({ rules: [], logs: [] }, function (result) {
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

      const nextLogs = [
        {
          id: "log-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
          ruleId: hit.ruleId,
          ruleName: hit.ruleName || "",
          matchedAt: hit.matchedAt || new Date().toISOString(),
          url: hit.url || "",
          method: hit.method || "",
          resourceType: hit.resourceType || "",
          originalResponse: truncateText(hit.originalResponse),
          rewrittenResponse: truncateText(hit.rewrittenResponse)
        }
      ].concat(Array.isArray(result.logs) ? result.logs : []).slice(0, MAX_LOGS);

      chrome.storage.local.set({ rules: nextRules, logs: nextLogs });
    });
  }

  loadRulesAndSync();

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local" || !changes.rules) {
      return;
    }

    sendRulesToPage(normalizeRules(changes.rules.newValue));
  });

  window.addEventListener("message", function (event) {
    if (event.source !== window || !event.data || event.data.source !== PAGE_SOURCE) {
      return;
    }

    if (event.data.type === "REQUEST_RULES") {
      loadRulesAndSync();
    }

    if (event.data.type === "RULE_HIT") {
      recordRuleHit(event.data);
    }

    if (event.data.type === "OPEN_MANAGER") {
      chrome.runtime.sendMessage({ type: "OPEN_MANAGER" });
    }
  });

  injectPageScript();
})();
