# ResponseRewriter

<p align="center">
  <strong>一个用于拦截并改写 XHR / Fetch 响应的 Chrome 扩展。</strong>
</p>

<p align="center">
  <a href="./README.en.md">English</a> ·
  <a href="#功能特性">功能特性</a> ·
  <a href="#安装方式">安装方式</a> ·
  <a href="#使用方式">使用方式</a> ·
  <a href="#项目结构">项目结构</a>
</p>

---

## 简介

ResponseRewriter 是一个 Chrome Manifest V3 扩展。它会在页面上下文中注入脚本，拦截 `XMLHttpRequest` 和 `fetch` 请求，根据请求方法和 URL 规则匹配请求，并在命中后替换、合并或动态转换响应体。

它适合用于本地开发调试、前后端联调、接口 Mock、临时改写响应内容等场景，不需要修改后端服务。

## 功能特性

- **支持 XHR 和 Fetch**：可以改写 `XMLHttpRequest` 和 `fetch` 的响应。
- **多种 URL 匹配方式**：支持精确、包含和正则匹配，匹配时忽略查询参数。
- **多种响应处理方式**：支持整段替换、JSON 局部合并和 JavaScript 动态转换。
- **实时同步规则**：保存规则后，会立即同步到已打开页面。
- **命中统计**：记录命中次数、最近命中 URL、命中时间和资源类型。
- **拦截日志**：可以查看每次命中的原始响应和改写后响应。
- **多语言界面**：支持中文、英文、日文、韩文。
- **主题切换**：支持浅色和暗黑主题。
- **无需构建**：使用原生 HTML、CSS、JavaScript，可直接作为未打包扩展加载。

## 安装方式

1. 克隆或下载当前仓库。
2. 打开 Chrome，访问 `chrome://extensions/`。
3. 开启右上角 **开发者模式**。
4. 点击 **加载已解压的扩展程序**。
5. 选择当前项目目录。
6. 点击扩展图标，打开管理页面。

## 使用方式

1. 打开扩展管理页面。
2. 点击 **新增** 创建规则。
3. 填写规则名称和请求方法，选择 URL 匹配方式与响应处理方式。
4. 填写 URL 匹配值和响应内容或转换脚本。
5. 保存规则。
6. 刷新或继续使用目标页面，命中的 XHR / Fetch 响应会被改写。
7. 在管理页面查看命中次数和拦截日志。

### URL 匹配方式

- **精确匹配**（`urlMode: "exact"`）：按 URL 来源和路径匹配；以 `/` 开头时只比较路径。
- **包含匹配**（`urlMode: "contains"`）：URL 中包含指定文本时命中。
- **正则匹配**（`urlMode: "regex"`）：使用 JavaScript `RegExp` 匹配动态路径，例如 `/api/users/\d+$`。

三种模式都会先移除查询参数和哈希片段再进行匹配。

### 响应处理方式

- **整段替换**（`mode: "replace"`）：使用规则中的内容替换整个响应体。旧规则默认使用此模式。
- **JSON 局部合并**（`mode: "json-merge"`）：递归合并原响应与规则中的 JSON 对象；嵌套对象会合并，数组和普通值会替换。
- **JavaScript 转换**（`mode: "script"`）：执行转换脚本。脚本可以使用以下参数：
  - `originalResponse`：当前响应文本。
  - `context.method`：请求方法。
  - `context.url`：请求 URL。
  - `context.resourceType`：`xhr` 或 `fetch`。

JavaScript 脚本可以返回字符串或 JSON 值。转换报错时会保留原响应，并在页面控制台输出错误。

### 示例规则

```json
{
  "enabled": true,
  "name": "改写用户信息接口",
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

JSON 局部合并示例：

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

JavaScript 转换脚本示例：

```js
const data = JSON.parse(originalResponse);
data.role = "admin";
data.requestUrl = context.url;
return data;
```

## 测试

项目使用 Node.js 内置测试运行器，无需安装依赖：

```powershell
node --test
```

## 项目结构

```text
.
├── manifest.json       # Chrome 扩展清单
├── background.js       # 打开管理页并更新扩展角标
├── content.js          # 连接扩展存储和页面注入脚本
├── injected.js         # 在页面上下文中拦截 XHR / Fetch
├── manager.html        # 主要规则管理页面
├── popup.html          # 早期弹窗页面
├── popup.css           # 共享样式
├── popup.js            # 管理页交互逻辑和规则持久化
├── sample-rules.json   # 示例规则数据
└── test                # Node.js 单元测试
```

## 权限说明

- `storage`：在本地保存规则、日志、语言和主题配置。
- `<all_urls>`：允许内容脚本运行在需要拦截请求的页面中。

## 注意事项和限制

- URL 匹配会忽略查询参数。
- 规则数据保存在 Chrome 扩展本地存储中。
- 当前主要面向文本响应改写，不针对二进制响应。
- JSON 局部合并要求原响应和规则内容都是 JSON 对象。
- JavaScript 转换使用 `new Function` 执行；如果目标页面的 CSP 禁止动态代码执行，会保留原响应。
- 转换脚本在页面上下文中运行，只应使用自己编写和确认安全的脚本。
- 该工具面向开发和测试场景。在敏感页面启用前，请确认规则内容。

## 参与贡献

欢迎提交 Issue 或 Pull Request。请尽量保持改动聚焦，并与当前原生 JavaScript 实现风格一致。

## 许可证

当前项目尚未声明许可证。
