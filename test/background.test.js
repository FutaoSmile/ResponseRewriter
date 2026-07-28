const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const backgroundSource = fs.readFileSync(path.join(__dirname, "..", "src", "background.js"), "utf8");
const defaultDataSource = fs.readFileSync(path.join(__dirname, "..", "src", "default-data.js"), "utf8");

function createHarness(initialState) {
  const listeners = {};
  const badgeCalls = [];
  const storageWrites = [];
  let state = Object.assign({}, initialState);
  const context = {
    importScripts(value) {
      assert.equal(value, "default-data.js");
      vm.runInContext(defaultDataSource, context);
    },
    chrome: {
      action: {
        onClicked: {
          addListener(listener) {
            listeners.actionClicked = listener;
          }
        },
        setBadgeBackgroundColor(value) {
          badgeCalls.push(["background", value]);
        },
        setBadgeTextColor(value) {
          badgeCalls.push(["color", value]);
        },
        setBadgeText(value) {
          badgeCalls.push(["text", value]);
        },
        setTitle(value) {
          badgeCalls.push(["title", value]);
        }
      },
      tabs: { create() {} },
      runtime: {
        getURL(value) {
          return value;
        },
        onMessage: { addListener() {} },
        onInstalled: {
          addListener(listener) {
            listeners.installed = listener;
          }
        },
        onStartup: { addListener() {} }
      },
      storage: {
        local: {
          get(defaults, callback) {
            callback(Object.assign({}, defaults, state));
          },
          set(values, callback) {
            storageWrites.push(values);
            state = Object.assign({}, state, values);
            if (callback) callback();
          }
        },
        onChanged: {
          addListener(listener) {
            listeners.storageChanged = listener;
          }
        }
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(backgroundSource, context);
  return {
    badgeCalls: badgeCalls,
    storageWrites: storageWrites,
    refresh() {
      listeners.installed();
    },
    install(details) {
      listeners.installed(details);
    },
    getState() {
      return state;
    },
    setState(nextState) {
      state = Object.assign({}, state, nextState);
    },
    notify(changes) {
      listeners.storageChanged(changes, "local");
    }
  };
}

test("paused interception is continuously visible on the extension badge", function () {
  const harness = createHarness({ interceptionEnabled: false });
  harness.refresh();

  assert.ok(harness.badgeCalls.some(function (entry) {
    return entry[0] === "text" && entry[1].text === "OFF";
  }));
  assert.ok(harness.badgeCalls.some(function (entry) {
    return entry[0] === "title" && /Paused/.test(entry[1].title);
  }));
});

test("resuming interception restores the hit-count badge", function () {
  const harness = createHarness({
    interceptionEnabled: false,
    privacyConsentVersion: 1,
    rules: [{ stats: { hitCount: 7 } }]
  });
  harness.refresh();
  harness.setState({ interceptionEnabled: true });
  harness.notify({ interceptionEnabled: { newValue: true } });

  const badgeTexts = harness.badgeCalls.filter(function (entry) {
    return entry[0] === "text";
  });
  assert.equal(badgeTexts.at(-1)[1].text, "7");
});

test("first install initializes disabled examples and sample logs", function () {
  const harness = createHarness({});
  harness.install({ reason: "install" });
  const state = harness.getState();

  assert.equal(state.rules.length, 4);
  assert.equal(state.logs.length, 4);
  assert.ok(state.rules.every(function (rule) { return rule.enabled === false; }));
  assert.ok(state.logs.every(function (log) { return log.isExample === true; }));
  assert.equal(state.privacyConsentVersion, 0);
});

test("existing install data is preserved while missing consent state is initialized", function () {
  const existingRules = [{ id: "custom-rule" }];
  const existingLogs = [{ id: "custom-log" }];
  const harness = createHarness({ rules: existingRules, logs: existingLogs });

  harness.install({ reason: "update" });
  harness.install({ reason: "install" });

  assert.equal(harness.storageWrites.length, 1);
  assert.equal(harness.getState().rules, existingRules);
  assert.equal(harness.getState().logs, existingLogs);
  assert.equal(harness.getState().privacyConsentVersion, 0);
});

test("interception stays paused until privacy consent is granted", function () {
  const harness = createHarness({
    interceptionEnabled: true,
    rules: [{ stats: { hitCount: 7 } }]
  });
  harness.refresh();

  assert.ok(harness.badgeCalls.some(function (entry) {
    return entry[0] === "text" && entry[1].text === "OFF";
  }));
});
