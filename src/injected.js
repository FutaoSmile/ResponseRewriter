(function () {
  const EXTENSION_SOURCE = "response-rewriter-extension";
  const PAGE_SOURCE = "response-rewriter-page";
  const TOAST_I18N = {
    "zh-CN": {
      open: "打开 ResponseRewriter",
      rewritten: "ResponseRewriter · 响应已改写 · "
    },
    en: {
      open: "Open ResponseRewriter",
      rewritten: "ResponseRewriter · Response rewritten · "
    },
    ja: {
      open: "ResponseRewriter を開く",
      rewritten: "ResponseRewriter · レスポンスを書き換えました · "
    },
    ko: {
      open: "ResponseRewriter 열기",
      rewritten: "ResponseRewriter · 응답이 수정됨 · "
    }
  };
  let activeRules = [];
  let rulesReady = false;
  const rulesReadyCallbacks = [];
  const RULES_READY_TIMEOUT = 500;

  function markRulesReady() {
    rulesReady = true;
    while (rulesReadyCallbacks.length) {
      rulesReadyCallbacks.shift()();
    }
  }

  function waitForRules() {
    if (rulesReady) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      var resolved = false;
      var timer = setTimeout(markRulesReady, RULES_READY_TIMEOUT);

      function done() {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve();
      }

      rulesReadyCallbacks.push(done);
    });
  }

  function getToastLocale() {
    var lang = String(navigator.language || "").toLowerCase();
    if (lang.indexOf("ja") === 0) return "ja";
    if (lang.indexOf("ko") === 0) return "ko";
    if (lang.indexOf("en") === 0) return "en";
    return "zh-CN";
  }

  function toastText(key) {
    var locale = getToastLocale();
    return (TOAST_I18N[locale] && TOAST_I18N[locale][key]) || TOAST_I18N["zh-CN"][key];
  }

  function matchesMethod(actual, expected) {
    if (!expected) {
      return true;
    }
    return String(actual || "").toUpperCase() === String(expected).toUpperCase();
  }

  function matchesUrl(actual, expected, mode) {
    if (!expected) {
      return false;
    }

    var actualText = String(actual || "").trim();
    var expectedText = String(expected || "").trim();
    var comparableUrl = stripUrlSuffix(actualText);
    mode = mode || "exact";

    if (mode === "contains") {
      return comparableUrl.indexOf(expectedText) !== -1;
    }

    if (mode === "regex") {
      try {
        return new RegExp(expectedText).test(comparableUrl);
      } catch (e) {
        return false;
      }
    }

    var actualUrl = parseUrl(actualText);
    var expectedUrl = parseUrl(expectedText);

    if (actualUrl && expectedUrl) {
      if (expectedText.charAt(0) === "/") {
        return normalizePath(actualUrl.pathname) === normalizePath(expectedUrl.pathname);
      }

      return actualUrl.origin === expectedUrl.origin &&
        normalizePath(actualUrl.pathname) === normalizePath(expectedUrl.pathname);
    }

    return stripUrlSuffix(actualText) === stripUrlSuffix(expectedText);
  }

  function normalizePath(pathname) {
    var value = String(pathname || "/");
    if (value.length > 1 && value.endsWith("/")) {
      return value.slice(0, -1);
    }
    return value;
  }

  function parseUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (e) {
      return null;
    }
  }

  function stripUrlSuffix(value) {
    return String(value || "").replace(/[?#].*$/, "");
  }

  function ruleApplies(rule, context) {
    if (!rule || rule.enabled === false) {
      return false;
    }

    return matchesMethod(context.method, rule.match && rule.match.method) &&
      matchesUrl(
        context.url,
        rule.match && rule.match.url,
        rule.match && rule.match.urlMode
      );
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function mergeJsonObject(original, patch) {
    var result = Object.assign({}, original);

    Object.keys(patch).forEach(function (key) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return;
      }

      result[key] = isPlainObject(result[key]) && isPlainObject(patch[key])
        ? mergeJsonObject(result[key], patch[key])
        : patch[key];
    });

    return result;
  }

  function toResponseText(value, fallback) {
    if (typeof value === "undefined") {
      return fallback;
    }
    if (typeof value === "string") {
      return value;
    }

    var serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : fallback;
  }

  function applyRewrite(rule, context) {
    const body = rule && rule.rewrite ? rule.rewrite.body : "";
    const mode = rule && rule.rewrite ? rule.rewrite.mode : "replace";
    const originalText = context.responseText;

    if (typeof body !== "string") {
      return originalText;
    }

    try {
      if (mode === "json-merge") {
        const original = JSON.parse(originalText);
        const patch = JSON.parse(body);
        if (!isPlainObject(original) || !isPlainObject(patch)) {
          return originalText;
        }
        return JSON.stringify(mergeJsonObject(original, patch));
      }

      if (mode === "script") {
        const transform = new Function("originalResponse", "context", body);
        return toResponseText(transform(originalText, {
          method: context.method,
          url: context.url,
          resourceType: context.resourceType
        }), originalText);
      }
    } catch (error) {
      console.error("ResponseRewriter transform failed:", error);
      return originalText;
    }

    return body;
  }

  function hasMatchableRules() {
    return activeRules.some(function (rule) {
      return rule && rule.enabled !== false && rule.match && rule.match.url;
    });
  }

  function getFetchContext(input, init) {
    var method = init && init.method ? init.method : "";
    var url = "";

    if (input && typeof input === "object" && typeof input.url === "string") {
      method = method || input.method || "GET";
      url = input.url || "";
    } else {
      method = method || "GET";
      url = String(input || "");
      try {
        url = new URL(url, window.location.href).href;
      } catch (e) {
        // Keep the original value if URL parsing fails.
      }
    }

    return {
      method: method,
      url: url
    };
  }

  function rewriteText(context) {
    let currentText = context.responseText;
    const matchedRules = [];

    for (const rule of activeRules) {
      const nextContext = Object.assign({}, context, { responseText: currentText });
      if (!ruleApplies(rule, nextContext)) {
        continue;
      }

      matchedRules.push(rule);
      currentText = applyRewrite(rule, nextContext);
    }

    return { text: currentText, matchedRules };
  }

  function getToastMount() {
    return document.body || document.documentElement;
  }

  function openManager() {
    window.postMessage(
      {
        source: PAGE_SOURCE,
        type: "OPEN_MANAGER"
      },
      "*"
    );
  }

  function getToastContainer(mount) {
    var container = document.getElementById("__response_rewriter_toasts__");
    if (container) return container;

    container = document.createElement("div");
    container.id = "__response_rewriter_toasts__";
    container.style.cssText = [
      "position:fixed",
      "right:16px",
      "top:32px",
      "z-index:2147483647",
      "display:flex",
      "flex-direction:column",
      "align-items:flex-end",
      "gap:8px",
      "max-width:420px",
      "pointer-events:none"
    ].join(";");
    mount.appendChild(container);
    return container;
  }

  function createToastItem() {
    var toast = document.createElement("div");
    toast.style.cssText = [
      "max-width:420px",
      "padding:10px 14px",
      "border-radius:8px",
      "border:1px solid rgba(21,128,61,0.26)",
      "background:linear-gradient(135deg,rgba(240,253,244,0.97),rgba(220,252,231,0.97))",
      "color:#14532d",
      "box-shadow:0 8px 24px rgba(21,128,61,0.16)",
      "font:12px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif",
      "pointer-events:auto",
      "cursor:pointer",
      "display:flex",
      "align-items:center",
      "gap:8px",
      "white-space:nowrap",
      "overflow:hidden",
      "transition:opacity 160ms ease,transform 160ms ease"
    ].join(";");

    var text = document.createElement("span");
    text.style.cssText = "overflow:hidden;text-overflow:ellipsis;";
    var count = document.createElement("span");
    count.style.cssText = [
      "display:none",
      "flex:0 0 auto",
      "min-width:24px",
      "padding:1px 7px",
      "border-radius:999px",
      "background:rgba(21,128,61,0.14)",
      "color:#166534",
      "font-weight:700",
      "text-align:center"
    ].join(";");

    toast.__responseRewriterText = text;
    toast.__responseRewriterCount = count;
    toast.appendChild(text);
    toast.appendChild(count);
    toast.title = toastText("open");
    toast.addEventListener("click", openManager);
    return toast;
  }

  function showRewriteToast(rule, context) {
    var mount = getToastMount();
    if (!mount) return;

    var url = parseUrl(context.url);
    var target = url ? url.pathname : stripUrlSuffix(context.url);
    var method = context.method || "GET";
    var key = method + " " + target;
    var container = getToastContainer(mount);
    var toast = null;

    Array.prototype.some.call(container.children, function (item) {
      if (item.dataset && item.dataset.rewriteKey === key) {
        toast = item;
        return true;
      }

      return false;
    });

    if (!toast) {
      toast = createToastItem();
      toast.dataset.rewriteKey = key;
      toast.__responseRewriterHitCount = 0;
      container.insertBefore(toast, container.firstChild);
    }

    toast.__responseRewriterHitCount += 1;
    toast.__responseRewriterText.textContent = toastText("rewritten") + key;
    if (toast.__responseRewriterHitCount > 1) {
      toast.__responseRewriterCount.style.display = "inline-block";
      toast.__responseRewriterCount.textContent = "x" + toast.__responseRewriterHitCount;
    }
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast.__responseRewriterTimer);
    toast.__responseRewriterTimer = setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-4px)";
      setTimeout(function () {
        if (toast.parentNode && toast.style.opacity === "0") {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, 3500);
  }

  function emitRuleHit(rule, context) {
    showRewriteToast(rule, context);

    window.postMessage(
      {
        source: PAGE_SOURCE,
        type: "RULE_HIT",
        ruleId: rule.id,
        ruleName: rule.name || "",
        matchedAt: new Date().toISOString(),
        url: context.url,
        method: context.method,
        resourceType: context.resourceType,
        originalResponse: context.originalResponse,
        rewrittenResponse: context.rewrittenResponse
      },
      "*"
    );
  }

  function patchXhr() {
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, async) {
      this.__interceptor = {
        method: method || "GET",
        url: url,
        async: async !== false
      };
      return nativeOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      const xhr = this;

      if (!xhr.__interceptorBound) {
        xhr.__interceptorBound = true;

        xhr.addEventListener("readystatechange", function () {
          if (xhr.readyState !== 4 || !xhr.__interceptor) {
            return;
          }

          if (xhr.responseType !== "" && xhr.responseType !== "text") {
            return;
          }

          if (typeof xhr.responseText !== "string") {
            return;
          }

          const result = rewriteText({
            resourceType: "xhr",
            method: xhr.__interceptor.method,
            url: String(xhr.responseURL || xhr.__interceptor.url || ""),
            responseText: xhr.responseText
          });

          if (result.text === xhr.responseText) {
            return;
          }

          result.matchedRules.forEach(function (rule) {
            emitRuleHit(rule, {
              resourceType: "xhr",
              method: xhr.__interceptor.method,
              url: String(xhr.responseURL || xhr.__interceptor.url || ""),
              originalResponse: xhr.responseText,
              rewrittenResponse: result.text
            });
          });

          Object.defineProperty(xhr, "responseText", {
            configurable: true,
            value: result.text
          });
          Object.defineProperty(xhr, "response", {
            configurable: true,
            value: result.text
          });
        });
      }

      if (xhr.__interceptor && xhr.__interceptor.async !== false) {
        waitForRules();
      }

      return nativeSend.apply(xhr, arguments);
    };
  }

  function patchFetch() {
    const nativeFetch = window.fetch;

    window.fetch = function (input, init) {
      const fetchThis = this;
      const fetchArgs = arguments;
      const requestContext = getFetchContext(input, init);

      return waitForRules().then(function () {
        if (!hasMatchableRules()) {
          return nativeFetch.apply(fetchThis, fetchArgs);
        }

        // Check if any enabled rule could match — if not, use native fetch to preserve streaming
        const couldMatch = activeRules.some(function (rule) {
          return ruleApplies(rule, {
            method: requestContext.method,
            url: requestContext.url,
            responseText: ""
          });
        });

        if (!couldMatch) {
          return nativeFetch.apply(fetchThis, fetchArgs);
        }

        // At least one rule matches — await full response so we can rewrite it
        return nativeFetch.apply(fetchThis, fetchArgs).then(async function (response) {
          let originalText = "";
          try {
            originalText = await response.clone().text();
          } catch (e) {
            return response;
          }

          const result = rewriteText({
            resourceType: "fetch",
            method: requestContext.method,
            url: response.url || requestContext.url,
            responseText: originalText
          });

          if (result.text === originalText) {
            return response;
          }

          result.matchedRules.forEach(function (rule) {
            emitRuleHit(rule, {
              resourceType: "fetch",
              method: requestContext.method,
              url: response.url || requestContext.url,
              originalResponse: originalText,
              rewrittenResponse: result.text
            });
          });

          const headers = new Headers(response.headers);
          headers.delete("content-length");

          return new Response(result.text, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        });
      });
    };
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window || !event.data || event.data.source !== EXTENSION_SOURCE) {
      return;
    }

    if (event.data.type === "SET_RULES") {
      activeRules = Array.isArray(event.data.rules) ? event.data.rules : [];
      markRulesReady();
    }
  });

  patchXhr();
  patchFetch();

  window.postMessage(
    {
      source: PAGE_SOURCE,
      type: "REQUEST_RULES"
    },
    "*"
  );
})();
