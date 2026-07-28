function createRuleId() {
  return "rule-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


function createBlankRule() {
  return {
    id: createRuleId(),
    enabled: true,
    name: t("newRule"),
    match: {
      method: "",
      urlMode: "exact",
      url: ""
    },
    rewrite: {
      mode: "replace",
      body: ""
    },
    stats: createEmptyStats()
  };
}

function createEmptyStats() {
  return {
    hitCount: 0,
    lastMatchedAt: "",
    lastMatchedUrl: "",
    lastResourceType: ""
  };
}

function createUniqueRuleId(existingIds) {
  var nextId = createRuleId();
  while (existingIds.has(nextId)) {
    nextId = createRuleId();
  }
  existingIds.add(nextId);
  return nextId;
}

function resetRuleIdentity(rule, existingIds, nameSuffix) {
  var nextRule = normalizeRule(rule, 0);
  nextRule.id = createUniqueRuleId(existingIds);
  nextRule.name = nameSuffix ? nextRule.name + " " + nameSuffix : nextRule.name;
  nextRule.stats = createEmptyStats();
  return nextRule;
}

function getImportRulesPayload(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && Array.isArray(parsed.rules)) {
    return parsed.rules;
  }

  return [];
}

function getExportRulesPayload() {
  return rules.map(function (rule) {
    var exported = clone(rule);
    exported.stats = createEmptyStats();
    return exported;
  });
}


function normalizeRule(rule, index) {
  // Storage and imported files can contain pre-urlMode/pre-rewriteMode rules or the
  // retired match.domain field. Omit that field so legacy rules no longer retain a
  // hidden site restriction, while preserving their historical mode defaults.
  const match = rule && rule.match && typeof rule.match === "object" ? rule.match : {};
  const rewrite = rule && rule.rewrite && typeof rule.rewrite === "object" ? rule.rewrite : {};

  return {
    id: rule && rule.id ? String(rule.id) : createRuleId() + "-" + index,
    enabled: rule ? rule.enabled !== false : true,
    name: rule && rule.name ? String(rule.name) : t("unnamedRule"),
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

function normalizeRules(inputRules) {
  var source = Array.isArray(inputRules) ? inputRules : [];
  return source.map(normalizeRule);
}

function reorderRulesByVisiblePositions(allRules, visibleRules, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= visibleRules.length ||
    toIndex >= visibleRules.length
  ) {
    return allRules.slice();
  }

  var reorderedVisibleRules = visibleRules.slice();
  var movedRule = reorderedVisibleRules.splice(fromIndex, 1)[0];
  reorderedVisibleRules.splice(toIndex, 0, movedRule);

  var visibleIds = new Set(visibleRules.map(function (rule) { return rule.id; }));
  var visibleIndex = 0;
  return allRules.map(function (rule) {
    return visibleIds.has(rule.id) ? reorderedVisibleRules[visibleIndex++] : rule;
  });
}

function createRuleValidationError(message, field) {
  var error = new Error(message);
  error.field = field;
  return error;
}

function validateRule(rule) {
  if (!rule.name.trim()) {
    throw createRuleValidationError(t("ruleNameRequired"), "ruleName");
  }
  if (!rule.match.url.trim()) {
    throw createRuleValidationError(t("urlRequired"), "urlMatchValue");
  }
  if (rule.match.urlMode === "regex") {
    try {
      new RegExp(rule.match.url);
    } catch (error) {
      throw createRuleValidationError(t("invalidRegex", { message: error.message }), "urlMatchValue");
    }
  }
  if (rule.rewrite.mode === "json-merge") {
    try {
      var patch = JSON.parse(rule.rewrite.body);
      if (!patch || Array.isArray(patch) || typeof patch !== "object") {
        throw new Error();
      }
    } catch (error) {
      throw createRuleValidationError(t("mergeBodyMustBeObject"), "rewriteBody");
    }
  }
}

/* ================================================================
   Read from form
   ================================================================ */
