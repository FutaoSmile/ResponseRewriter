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

ResponseRewriter is a Chrome Manifest V3 extension that injects a page-context script to hook `XMLHttpRequest` and `fetch`, match requests by method and URL path, and replace the response body when a rule is hit.

It is designed for local development, debugging, frontend integration testing, mock API responses, and quick response rewriting without changing backend services.

## Features

- **XHR and Fetch interception**: Rewrite responses from both `XMLHttpRequest` and `fetch`.
- **Configurable rules**: Match by request method and URL path while ignoring query parameters.
- **Full response replacement**: Return a custom response body when a rule matches.
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
3. Fill in the rule name, request method, URL match value, and response body.
4. Save the rule.
5. Refresh or continue using the target page. Matching XHR / Fetch responses will be rewritten.
6. Check hit counts and logs in the manager page.

### Example Rule

```json
{
  "enabled": true,
  "name": "Rewrite user profile API",
  "match": {
    "method": "GET",
    "url": "/api/user/profile"
  },
  "rewrite": {
    "body": "{\n  \"nickname\": \"mocked-by-extension\"\n}"
  }
}
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
└── sample-rules.json   # Example rule data
```

## Permissions

- `storage`: stores rules, logs, locale, and theme locally.
- `<all_urls>`: allows the content script to run on pages where request interception is needed.

## Notes and Limitations

- URL matching ignores query parameters.
- Rules are stored locally in Chrome extension storage.
- The extension rewrites text-based responses. Binary responses are not targeted.
- This tool is intended for development and testing. Review your rules before enabling it on sensitive pages.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and consistent with the existing plain JavaScript implementation.

## License

No license has been specified yet.
