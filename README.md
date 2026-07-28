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
- **多种响应处理方式**：支持完整替换、JSON 局部合并和 JavaScript 动态转换。
- **可控的执行顺序**：规则从上到下执行，可直接调整优先级；`mock-fetch` 使用第一条匹配规则。
- **全局暂停**：可通过顶部开关一键暂停全部拦截。
- **规则搜索与筛选**：支持按名称、方法、URL、状态和响应处理方式查找规则。
- **实时同步规则**：保存规则后，会立即同步到已打开页面。
- **命中统计**：根据当前保留的拦截日志实时统计每条规则的命中次数，并记录最近命中 URL、命中时间和资源类型。
- **响应差异视图**：原始响应与改写后响应逐行对齐，突出显示新增、删除和替换内容。
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

首次安装会初始化 4 条默认停用的示例规则和 4 条带“示例日志”标记的演示记录，覆盖精确、包含、正则匹配以及完整替换、JSON 局部合并、JavaScript 转换和直接拦截 Fetch。示例日志不会计入真实命中次数；升级或已有本地数据时不会覆盖。

## 使用方式

1. 打开扩展管理页面。
2. 点击 **新增** 创建规则。
3. 填写规则名称和请求方法，选择 URL 匹配方式与响应处理方式。
4. 填写 URL 匹配值和响应内容或转换脚本。
5. 保存规则。
6. 刷新或继续使用目标页面：普通规则会改写命中的 XHR / Fetch 响应；直接返回规则会阻止命中的 Fetch 发往服务器。
7. 在管理页面查看命中次数和拦截日志。XHR 命中直接返回规则时会正常发往服务器，并显示醒目的警告标识。
8. 多条规则命中同一请求时，普通规则按照列表从上到下依次处理；拖动规则名称左侧的手柄调整顺序。键盘操作时，聚焦手柄并按 `Alt+↑/↓`。

顶部 **拦截** 开关用于暂停或恢复全部规则。暂停时扩展角标显示 `OFF`，页面请求保持原样。扩展会运行在所有 URL 和子 frame 中；在敏感页面使用前，建议暂停拦截。

导入规则前会显示新增数量和 ID 冲突数量。导入内容会生成新 ID 并追加到列表顶部，不会覆盖现有规则。

### URL 匹配方式

| 方式 | 填写示例 | 会匹配 |
| --- | --- | --- |
| **精确匹配**（`exact`） | `/api/users/42` | 只匹配路径 `/api/users/42` |
| **包含匹配**（`contains`） | `/api/users/` | `/api/users/42`、`/api/users/profile` 等包含该片段的 URL |
| **正则匹配**（`regex`） | `^https://api\.example\.com/users/\d+$` | 用户 ID 为数字的动态完整 URL；填写时不要添加两侧的 `/` |

三种模式都会先移除查询参数和哈希片段再进行匹配。

### 响应处理方式

| 方式 | 填写示例 | 适用场景 |
| --- | --- | --- |
| **完整替换**（`replace`） | `{"code":0,"data":{"name":"Mock"}}` | 完全忽略原响应，返回固定内容 |
| **JSON 局部合并**（`json-merge`） | `{"data":{"role":"admin"}}` | 只修改指定 JSON 字段，保留原响应的其他字段 |
| **JavaScript 转换**（`script`） | `const data = JSON.parse(originalResponse);`<br>`data.role = "admin";`<br>`return data;` | 根据原响应或请求信息动态计算结果 |
| **拦截 Fetch，直接返回**（`mock-fetch`） | `{"code":0,"data":{"source":"local"}}` | 不向服务器发送 Fetch，直接返回固定内容 |

`mock-fetch` 只处理 Fetch：第一个匹配的直接返回规则会返回 HTTP 200 和 JSON 内容类型。XHR 命中时不会被拦截或改写，仍会发送至服务器，并记录“XHR 未拦截 · 已发送服务器”警告日志。

JavaScript 转换脚本可以使用以下参数：

  - `originalResponse`：当前响应文本。
  - `context.method`：请求方法。
  - `context.url`：请求 URL。
  - `context.resourceType`：`xhr` 或 `fetch`。

JavaScript 脚本可以返回字符串或 JSON 值。转换报错时会保留原响应，并在页面控制台输出错误。
管理页同时会记录“处理失败”日志和错误原因；规则命中但结果没有变化时会记录“命中但未变化”。

### 查看响应差异

在拦截日志或规则命中记录中打开 **拦截详情**：

- 左侧显示原始响应，右侧显示改写后响应，并使用行号对齐。
- 删除或被替换的行使用红色标记，新增行使用绿色标记。
- 顶部统计新增和删除行数；未变化的内容会降低视觉权重。
- JSON 响应会先格式化再比较，因此只有缩进或换行不同不会被识别为内容变化。
- 普通文本响应同样支持逐行比较。

在规则的 **命中记录** 弹窗中清空记录时，需要二次确认；确认后会删除该规则的拦截日志，其命中次数同步归零。

### 完整示例规则

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

拦截 Fetch 并直接返回示例：

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

## 测试

项目使用 Node.js 内置测试运行器，无需安装依赖：

```powershell
node --test
```

## 项目结构

```text
.
├── manifest.json       # Chrome 扩展清单
├── src                 # 扩展源代码
│   ├── background.js   # 打开管理页并更新扩展角标
│   ├── default-data.js # 首次安装使用的默认示例规则与日志
│   ├── content.js      # 连接扩展存储和页面注入脚本
│   ├── injected.js     # 在页面上下文中拦截 XHR / Fetch
│   └── ui              # 管理页面
│       ├── manager.html # 管理页面结构
│       ├── popup.css   # 管理页面设计系统与响应式样式
│       ├── i18n.js     # 多语言文案与翻译工具
│       ├── rule-model.js # 规则标准化与校验
│       ├── log-view.js # 日志列表与详情展示
│       ├── vendor      # 本地第三方依赖及许可证
│       └── popup.js    # 页面状态和事件协调
├── examples            # 示例规则
├── docs                # 项目文档和审查记录
└── test                # Node.js 单元测试
```

## 权限说明

- `storage`：在本地保存规则、日志、全局拦截状态、语言和主题配置。
- `<all_urls>`：允许内容脚本运行在需要拦截请求的页面中。

## 注意事项和限制

- URL 匹配会忽略查询参数。
- 规则数据保存在 Chrome 扩展本地存储中。
- 拦截日志只保留最近 100 条；单个原始响应或处理后响应最多保存 20000 个字符，详情中会显示截断标记和原始长度。
- 当前主要面向文本响应改写，不针对二进制响应。
- `mock-fetch` 只拦截页面上下文中的 Fetch，不拦截 XHR、Worker、`sendBeacon` 或标签资源请求。
- `mock-fetch` 命中后不会调用原生 Fetch，请求不会进入 Chrome 网络层，因此不会出现在开发者工具的 Network 面板中；请在扩展的拦截日志中查看该命中。
- `mock-fetch` 当前固定返回 HTTP 200 和 `application/json; charset=utf-8`。
- JSON 局部合并要求原响应和规则内容都是 JSON 对象。
- JavaScript 转换使用 `new Function` 执行；如果目标页面的 CSP 禁止动态代码执行，会保留原响应并记录失败日志。
- 转换脚本在页面上下文中运行，只应使用自己编写和确认安全的脚本。
- 该工具面向开发和测试场景。在敏感页面启用前，请确认规则内容。

## 参与贡献

欢迎提交 Issue 或 Pull Request。请尽量保持改动聚焦，并与当前原生 JavaScript 实现风格一致。

## 许可证

当前项目尚未声明许可证。

规则拖拽排序使用本地打包的 SortableJS 1.15.7，该组件采用 MIT License，许可证文本位于 `src/ui/vendor/SORTABLE-LICENSE.txt`。
