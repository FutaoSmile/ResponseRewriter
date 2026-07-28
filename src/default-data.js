(function (root) {
  "use strict";

  var RULE_TEMPLATES = [
    {
      id: "example-replace-exact",
      enabled: false,
      name: "[示例] 完整替换 · 精确匹配",
      match: {
        method: "GET",
        urlMode: "exact",
        url: "https://api.example.com/api/profile"
      },
      rewrite: {
        mode: "replace",
        body: "{\n  \"id\": 42,\n  \"nickname\": \"mocked-user\",\n  \"role\": \"tester\"\n}"
      }
    },
    {
      id: "example-json-merge-contains",
      enabled: false,
      name: "[示例] JSON 局部合并 · 包含匹配",
      match: {
        method: "GET",
        urlMode: "contains",
        url: "/api/users/"
      },
      rewrite: {
        mode: "json-merge",
        body: "{\n  \"data\": {\n    \"role\": \"admin\",\n    \"featureEnabled\": true\n  }\n}"
      }
    },
    {
      id: "example-script-regex",
      enabled: false,
      name: "[示例] JavaScript 转换 · 正则匹配",
      match: {
        method: "",
        urlMode: "regex",
        url: "^https://api\\.example\\.com/api/orders/\\d+$"
      },
      rewrite: {
        mode: "script",
        body: "const data = JSON.parse(originalResponse);\ndata.debug = true;\ndata.resourceType = context.resourceType;\nreturn data;"
      }
    },
    {
      id: "example-mock-fetch",
      enabled: false,
      name: "[示例] 拦截 Fetch · 直接返回",
      match: {
        method: "POST",
        urlMode: "exact",
        url: "/api/config"
      },
      rewrite: {
        mode: "mock-fetch",
        body: "{\n  \"debug\": true,\n  \"source\": \"local\",\n  \"serverRequested\": false\n}"
      }
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createEmptyStats() {
    return {
      hitCount: 0,
      lastMatchedAt: "",
      lastMatchedUrl: "",
      lastResourceType: ""
    };
  }

  function createRules() {
    return clone(RULE_TEMPLATES).map(function (rule) {
      rule.stats = createEmptyStats();
      return rule;
    });
  }

  function createLog(rule, values, matchedAt) {
    var originalResponse = values.originalResponse;
    var rewrittenResponse = values.rewrittenResponse;
    return {
      id: "example-log-" + rule.rewrite.mode,
      ruleId: rule.id,
      ruleName: rule.name,
      matchedAt: matchedAt,
      url: values.url,
      method: values.method,
      resourceType: values.resourceType,
      outcome: values.outcome || "rewritten",
      errorMessage: "",
      originalResponse: originalResponse,
      rewrittenResponse: rewrittenResponse,
      originalResponseLength: originalResponse.length,
      rewrittenResponseLength: rewrittenResponse.length,
      originalResponseTruncated: false,
      rewrittenResponseTruncated: false,
      isExample: true
    };
  }

  function createLogs() {
    var rules = createRules();
    var now = Date.now();
    return [
      createLog(rules[0], {
        url: "https://api.example.com/api/profile",
        method: "GET",
        resourceType: "xhr",
        originalResponse: "{\n  \"id\": 42,\n  \"nickname\": \"server-user\",\n  \"role\": \"viewer\"\n}",
        rewrittenResponse: rules[0].rewrite.body
      }, new Date(now - 180000).toISOString()),
      createLog(rules[1], {
        url: "https://api.example.com/api/users/42",
        method: "GET",
        resourceType: "fetch",
        originalResponse: "{\n  \"code\": 0,\n  \"data\": {\n    \"name\": \"Ada\",\n    \"role\": \"viewer\"\n  }\n}",
        rewrittenResponse: "{\n  \"code\": 0,\n  \"data\": {\n    \"name\": \"Ada\",\n    \"role\": \"admin\",\n    \"featureEnabled\": true\n  }\n}"
      }, new Date(now - 120000).toISOString()),
      createLog(rules[2], {
        url: "https://api.example.com/api/orders/1001",
        method: "GET",
        resourceType: "xhr",
        originalResponse: "{\n  \"orderId\": 1001,\n  \"status\": \"pending\"\n}",
        rewrittenResponse: "{\n  \"orderId\": 1001,\n  \"status\": \"pending\",\n  \"debug\": true,\n  \"resourceType\": \"xhr\"\n}"
      }, new Date(now - 60000).toISOString()),
      createLog(rules[3], {
        url: "https://app.example.com/api/config",
        method: "POST",
        resourceType: "fetch",
        outcome: "mock-fetch",
        originalResponse: "",
        rewrittenResponse: rules[3].rewrite.body
      }, new Date(now).toISOString())
    ];
  }

  root.ResponseRewriterDefaults = {
    createRules: createRules,
    createLogs: createLogs
  };
})(globalThis);
