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

ResponseRewriter 是一个 Chrome Manifest V3 扩展。它会在页面上下文中注入脚本，拦截 `XMLHttpRequest` 和 `fetch` 请求，根据请求方法和 URL 路径匹配规则，并在命中规则后替换响应体。

它适合用于本地开发调试、前后端联调、接口 Mock、临时改写响应内容等场景，不需要修改后端服务。

## 功能特性

- **支持 XHR 和 Fetch**：可以改写 `XMLHttpRequest` 和 `fetch` 的响应。
- **可配置规则**：支持按请求方法和 URL 路径匹配，匹配时忽略查询参数。
- **完整响应替换**：命中规则后直接返回自定义响应内容。
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
3. 填写规则名称、请求方法、URL 匹配值和命中后返回的响应内容。
4. 保存规则。
5. 刷新或继续使用目标页面，命中的 XHR / Fetch 响应会被改写。
6. 在管理页面查看命中次数和拦截日志。

### 示例规则

```json
{
  "enabled": true,
  "name": "改写用户信息接口",
  "match": {
    "method": "GET",
    "url": "/api/user/profile"
  },
  "rewrite": {
    "body": "{\n  \"nickname\": \"mocked-by-extension\"\n}"
  }
}
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
└── sample-rules.json   # 示例规则数据
```

## 权限说明

- `storage`：在本地保存规则、日志、语言和主题配置。
- `<all_urls>`：允许内容脚本运行在需要拦截请求的页面中。

## 注意事项和限制

- URL 匹配会忽略查询参数。
- 规则数据保存在 Chrome 扩展本地存储中。
- 当前主要面向文本响应改写，不针对二进制响应。
- 该工具面向开发和测试场景。在敏感页面启用前，请确认规则内容。

## 参与贡献

欢迎提交 Issue 或 Pull Request。请尽量保持改动聚焦，并与当前原生 JavaScript 实现风格一致。

## 许可证

当前项目尚未声明许可证。
