# ResponseRewriter

<p align="center">
  <strong>A Chrome extension for intercepting and rewriting XHR / Fetch responses with configurable rules.</strong>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> ·
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#project-structure">Project Structure</a>
</p>

---

## Introduction

ResponseRewriter is a Chrome Manifest V3 extension that injects a page-context script to hook `XMLHttpRequest` and `fetch`, match requests by method and URL rules, and replace, merge, or dynamically transform the response body when a rule is hit.

It is designed for local development, debugging, frontend integration testing, mock API responses, and quick response rewriting without changing backend services.

## Features

- **XHR and Fetch interception**: Rewrite responses from both `XMLHttpRequest` and `fetch`.
- **Multiple URL match modes**: Use exact, substring, or regular-expression matching while ignoring query parameters.
- **Multiple response modes**: Replace the whole body, merge JSON objects, or run a JavaScript transform.
- **Controllable execution order**: Rules run from top to bottom and can be reordered. `mock-fetch` uses the first matching rule.
- **Global pause**: Pause all interception with the switch at the top.
- **Rule search and filters**: Find rules by name, method, URL, status, or response mode.
- **Live rule sync**: Saved rules are synchronized to opened pages immediately.
- **Hit statistics**: Count each rule's hits from its currently retained intercept logs, and track the last matched URL, matched time, and resource type.
- **Response diff view**: Align original and rewritten responses by line and highlight additions, removals, and replacements.
- **Multilingual UI**: Supports Chinese, English, Japanese, and Korean.
- **Theme switching**: Supports light and dark themes.
- **No build step**: Plain HTML, CSS, and JavaScript. Load it directly as an unpacked Chrome extension.

## Installation

1. Clone or download this repository.
2. Open Chrome and visit `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project directory.
6. Click the extension icon to open the manager page.

On first install, the extension initializes four disabled example rules and four records marked as example logs. Together they cover exact, substring, and regular-expression matching plus whole-body replacement, JSON merge, JavaScript transform, and direct Fetch interception. Example logs do not count as real hits, and upgrades or existing local data are never overwritten.

## Usage

1. Open the extension manager page.
2. Click **Add** to create a rule.
3. Enter the rule name and request method, then select the URL match and response modes.
4. Enter the URL match value and response content or transform script.
5. Save the rule.
6. Refresh or continue using the target page. Regular rules rewrite matching XHR / Fetch responses; direct-return rules prevent matching Fetch requests from reaching the server.
7. Check hit counts and logs in the manager page. An XHR matching a direct-return rule still reaches the server and receives a prominent warning label.
8. When several rules match the same request, regular rules run from top to bottom. Drag the handle at the left of a rule name to reorder it. For keyboard sorting, focus the handle and press `Alt+Up/Down Arrow`.

Use the **Interception** switch at the top to pause or resume all rules. While paused, the extension badge shows `OFF` and page requests remain unchanged. The extension runs on all URLs and child frames; pause interception before working on sensitive pages.

Before an import is applied, the manager shows the number of incoming rules and ID conflicts. Imported rules receive new IDs and are added to the top without overwriting existing rules.

### URL Match Modes

| Mode | Value example | Matches |
| --- | --- | --- |
| **Exact** (`exact`) | `/api/users/42` | Only the `/api/users/42` path |
| **Contains** (`contains`) | `/api/users/` | URLs containing that segment, such as `/api/users/42` and `/api/users/profile` |
| **Regular expression** (`regex`) | `^https://api\.example\.com/users/\d+$` | Full dynamic URLs with a numeric user ID; omit surrounding `/` characters |

All three modes remove query parameters and URL fragments before matching.

### Response Modes

| Mode | Value example | Use when |
| --- | --- | --- |
| **Replace entire body** (`replace`) | `{"code":0,"data":{"name":"Mock"}}` | The original response should be completely replaced with fixed content |
| **Merge JSON** (`json-merge`) | `{"data":{"role":"admin"}}` | Only selected JSON fields should change while other fields remain |
| **JavaScript transform** (`script`) | `const data = JSON.parse(originalResponse);`<br>`data.role = "admin";`<br>`return data;` | The result must be calculated from the original response or request context |
| **Intercept Fetch and return directly** (`mock-fetch`) | `{"code":0,"data":{"source":"local"}}` | Return fixed content without sending the Fetch request to the server |

`mock-fetch` applies to Fetch only. The first matching direct-return rule produces an HTTP 200 response with a JSON content type. Matching XHR requests are neither intercepted nor rewritten; they reach the server and are logged as “XHR not intercepted · sent to server.”

JavaScript transforms receive these parameters:

  - `originalResponse`: the current response text.
  - `context.method`: the request method.
  - `context.url`: the request URL.
  - `context.resourceType`: `xhr` or `fetch`.

JavaScript transforms may return a string or JSON value. If a transform throws, the original response is preserved and the error is written to the page console.
The manager also records a “Processing failed” log with the error reason. A match that produces identical content is recorded as “Matched · unchanged.”

### Viewing Response Differences

Open an **Intercept Detail** from the intercept log or a rule's hit records:

- The original response appears on the left and the rewritten response on the right with aligned line numbers.
- Removed or replaced lines are marked in red; added lines are marked in green.
- The header shows added and removed line counts, while unchanged content is visually de-emphasized.
- JSON responses are formatted before comparison, so indentation-only changes are not reported as content changes.
- Plain-text responses also support line-by-line comparison.

Clearing records from a rule's **Hit Records** dialog requires confirmation. Once confirmed, the rule's intercept logs are deleted and its hit count returns to zero.

### Complete Example Rule

```json
{
  "enabled": true,
  "name": "Rewrite user profile API",
  "match": {
    "method": "GET",
    "urlMode": "exact",
    "url": "/api/user/profile"
  },
  "rewrite": {
    "mode": "replace",
    "body": "{\n  \"nickname\": \"mocked-by-extension\"\n}"
  }
}
```

JSON merge example:

```json
{
  "match": {
    "method": "GET",
    "urlMode": "regex",
    "url": "/api/users/\\d+$"
  },
  "rewrite": {
    "mode": "json-merge",
    "body": "{\n  \"role\": \"admin\"\n}"
  }
}
```

JavaScript transform example:

```js
const data = JSON.parse(originalResponse);
data.role = "admin";
data.requestUrl = context.url;
return data;
```

Intercept Fetch and return directly:

```json
{
  "match": {
    "method": "GET",
    "urlMode": "exact",
    "url": "/api/config"
  },
  "rewrite": {
    "mode": "mock-fetch",
    "body": "{\"debug\":true,\"source\":\"local\"}"
  }
}
```

## Testing

The project uses the built-in Node.js test runner and requires no test dependencies:

```powershell
node --test
```

## Project Structure

```text
.
├── manifest.json       # Chrome extension manifest
├── src                 # Extension source code
│   ├── background.js   # Opens manager page and updates extension badge
│   ├── default-data.js # Default example rules and logs for first install
│   ├── content.js      # Bridges extension storage and page-context script
│   ├── injected.js     # Hooks XHR / Fetch in the page context
│   └── ui              # Manager page
│       ├── manager.html # Manager page structure
│       ├── popup.css   # Manager design system and responsive styles
│       ├── i18n.js     # Localized copy and translation helpers
│       ├── rule-model.js # Rule normalization and validation
│       ├── log-view.js # Log list and detail rendering
│       ├── vendor      # Bundled third-party dependency and license
│       └── popup.js    # Page state and event coordination
├── examples            # Example rules
├── docs                # Project documentation and review records
└── test                # Node.js unit tests
```

## Permissions

- `storage`: stores rules, logs, global interception state, locale, and theme locally.
- `<all_urls>`: allows the content script to run on pages where request interception is needed.

## Notes and Limitations

- URL matching ignores query parameters.
- Rules are stored locally in Chrome extension storage.
- Only the latest 100 intercept logs are retained. Each original or processed response stores up to 20,000 characters; the detail view shows truncation and original lengths.
- The extension rewrites text-based responses. Binary responses are not targeted.
- `mock-fetch` intercepts Fetch in the page context only. It does not intercept XHR, workers, `sendBeacon`, or resource requests from HTML elements.
- When `mock-fetch` matches, it does not call the native Fetch implementation, so the request never enters Chrome's network stack and does not appear in the DevTools Network panel. Use the extension's interception log to inspect the match.
- `mock-fetch` currently returns HTTP 200 with `application/json; charset=utf-8`.
- JSON merge requires both the original response and configured content to be JSON objects.
- JavaScript transforms use `new Function`. If the target page CSP blocks dynamic code execution, the original response is preserved and a failure log is recorded.
- Transform scripts run in the page context. Only use scripts you wrote or have reviewed.
- This tool is intended for development and testing. Review your rules before enabling it on sensitive pages.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and consistent with the existing plain JavaScript implementation.

## License

No license has been specified yet.

Rule drag sorting uses the locally bundled SortableJS 1.15.7 component under the MIT License. Its license text is stored at `src/ui/vendor/SORTABLE-LICENSE.txt`.
