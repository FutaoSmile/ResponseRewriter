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
- **Live rule sync**: Saved rules are synchronized to opened pages immediately.
- **Hit statistics**: Track hit count, last matched URL, matched time, and resource type.
- **Intercept logs**: View original and rewritten responses for each hit.
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

## Usage

1. Open the extension manager page.
2. Click **Add** to create a rule.
3. Enter the rule name and request method, then select the URL match and response modes.
4. Enter the URL match value and response content or transform script.
5. Save the rule.
6. Refresh or continue using the target page. Matching XHR / Fetch responses will be rewritten.
7. Check hit counts and logs in the manager page.

### URL Match Modes

- **Exact** (`urlMode: "exact"`): Matches by URL origin and path. Values beginning with `/` compare only the path.
- **Contains** (`urlMode: "contains"`): Matches when the URL contains the configured text.
- **Regular expression** (`urlMode: "regex"`): Uses JavaScript `RegExp` for dynamic paths, such as `/api/users/\d+$`.

All three modes remove query parameters and URL fragments before matching.

### Response Modes

- **Replace entire body** (`mode: "replace"`): Replaces the full response with the configured content. Existing rules default to this mode.
- **Merge JSON** (`mode: "json-merge"`): Recursively merges the original response and configured JSON objects. Nested objects are merged; arrays and primitive values are replaced.
- **JavaScript transform** (`mode: "script"`): Runs a transform script with these parameters:
  - `originalResponse`: the current response text.
  - `context.method`: the request method.
  - `context.url`: the request URL.
  - `context.resourceType`: `xhr` or `fetch`.

JavaScript transforms may return a string or JSON value. If a transform throws, the original response is preserved and the error is written to the page console.

### Example Rule

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

## Testing

The project uses the built-in Node.js test runner and requires no test dependencies:

```powershell
node --test
```

## Project Structure

```text
.
├── manifest.json       # Chrome extension manifest
├── background.js       # Opens manager page and updates extension badge
├── content.js          # Bridges extension storage and page-context script
├── injected.js         # Hooks XHR / Fetch in the page context
├── manager.html        # Main rule manager page
├── popup.html          # Earlier popup UI
├── popup.css           # Shared styles
├── popup.js            # Manager UI logic and rule persistence
├── sample-rules.json   # Example rule data
└── test                # Node.js unit tests
```

## Permissions

- `storage`: stores rules, logs, locale, and theme locally.
- `<all_urls>`: allows the content script to run on pages where request interception is needed.

## Notes and Limitations

- URL matching ignores query parameters.
- Rules are stored locally in Chrome extension storage.
- The extension rewrites text-based responses. Binary responses are not targeted.
- JSON merge requires both the original response and configured content to be JSON objects.
- JavaScript transforms use `new Function`. If the target page CSP blocks dynamic code execution, the original response is preserved.
- Transform scripts run in the page context. Only use scripts you wrote or have reviewed.
- This tool is intended for development and testing. Review your rules before enabling it on sensitive pages.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and consistent with the existing plain JavaScript implementation.

## License

No license has been specified yet.
