# ResponseRewriter Privacy Policy

Effective date: July 28, 2026

## 中文

ResponseRewriter 是用于调试和改写网页 XHR/Fetch 响应的 Chrome 扩展。扩展不会使用分析服务、广告服务或开发者运营的远程服务器。

### 处理的数据

只有在你阅读产品内说明并主动同意启用拦截后，扩展才会处理：

- 你创建或导入的规则，包括规则名称、请求方法、URL 匹配条件、响应内容和转换脚本；
- 命中规则的请求 URL、请求方法、资源类型和时间；
- 命中规则时的原始响应、改写后响应、处理结果和错误信息；
- 语言、主题、全局拦截状态和隐私同意版本等偏好设置。

这些数据仅用于匹配请求、改写响应、展示命中统计和拦截日志。

### 存储、保留与共享

- 数据仅保存在你浏览器的 `chrome.storage.local` 中。
- 扩展最多保留最近 100 条日志；每条日志中的原始响应和改写后响应分别最多保存 20,000 个字符。
- 数据不会发送给开发者、分析平台、广告平台或其他第三方。
- 只有当你主动导出规则时，扩展才会在本机生成并下载规则文件。

### 你的控制权

你可以随时使用右上角电源图标暂停拦截，在管理页面清空日志或删除规则。卸载扩展会由 Chrome 删除扩展的本地存储。你也可以先选择“暂不启用”，此时扩展不会安装 XHR/Fetch 拦截器或处理页面请求数据。

### 权限用途

- `storage`：在本地保存规则、日志、界面偏好和同意状态。
- `<all_urls>`：让用户配置的规则能够在目标页面及其子 frame 中匹配和改写 XHR/Fetch 响应。

ResponseRewriter 对从 Chrome API 获得的信息的使用将遵守 [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)，包括 Limited Use 要求。

### 政策变更与联系

如果数据处理方式发生变化，扩展会在新方式生效前于产品界面中显著说明并再次取得同意。问题或请求可通过 [GitHub Issues](https://github.com/FutaoSmile/ResponseRewriter/issues) 联系开发者。

---

## English

ResponseRewriter is a Chrome extension for debugging and rewriting XHR/Fetch responses. It does not use analytics, advertising services, or developer-operated remote servers.

### Data handled

The extension only begins handling the following data after you review the in-product disclosure and affirmatively enable interception:

- Rules you create or import, including names, request methods, URL match conditions, response content, and transform scripts;
- Request URLs, methods, resource types, and timestamps for matched rules;
- Original responses, rewritten responses, outcomes, and error details for matched rules;
- Preferences such as language, theme, global interception state, and privacy consent version.

This data is used only to match requests, rewrite responses, and display hit statistics and interception logs.

### Storage, retention, and sharing

- Data is stored only in your browser's `chrome.storage.local`.
- The extension retains up to 100 recent logs. Original and rewritten responses are each limited to 20,000 characters per log.
- Data is not sent to the developer, analytics providers, advertising platforms, or other third parties.
- A rules file is created and downloaded locally only when you explicitly export rules.

### Your controls

You can pause interception with the power icon, clear logs, or delete rules at any time. Chrome removes the extension's local storage when you uninstall it. If you choose “Not now,” the extension does not install its XHR/Fetch hooks or handle page request data.

### Why permissions are used

- `storage`: stores rules, logs, interface preferences, and consent state locally.
- `<all_urls>`: allows user-configured rules to match and rewrite XHR/Fetch responses on target pages and their child frames.

ResponseRewriter's use of information received from Chrome APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.

### Changes and contact

If data practices change, the extension will prominently disclose the change in the product and obtain consent before the new practice takes effect. For questions or requests, contact the developer through [GitHub Issues](https://github.com/FutaoSmile/ResponseRewriter/issues).
