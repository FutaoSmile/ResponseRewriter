# ResponseRewriter

<p align="center">
  <img src="./src/icons/icon-master.png" width="144" height="144" alt="ResponseRewriter 图标">
</p>

<p align="center">
  <strong>无需改后端、不用起 Mock 服务，直接在浏览器里拦截并改写接口响应。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-MV3-blue?logo=googlechrome&logoColor=white" alt="Chrome MV3">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
  <img src="https://img.shields.io/badge/tests-69%20passed-brightgreen" alt="69 tests passed">
  <a href="./README.en.md">English</a>
</p>

---

## 你遇到过这些情况吗？

| 痛点 | 常见做法 | ResponseRewriter |
|---|---|---|
| 后端接口挂了，前端没法继续调 | 等着后端修 | 编一条规则，直接返回假数据继续干 |
| 联调时要反复改后端返回值看效果 | 改代码重启、或者 Postman mock | 填一行 JSON，刷新页面立刻生效 |
| 线上出 bug 想临时修一下返回值 | 热修复发版，流程长 | 写条正则匹配，脚本动态改写，关掉就恢复 |
| 想试一下某个极端数据下页面会不会崩 | 数据库里造数据 | 写条规则把某个字段改掉，马上验证 |
| 想知道某个请求到底返回了什么 | 切到 Network 面板翻半天 | 右侧面板直接列出每次请求，原始/改写内容逐行对比 |

**一句话：你在页面里看到的接口数据，随时可以接管。**

---

## 为什么选它而不是 Postman Mock / 抓包工具 / Whistle ...

- **零切换** — 不用离开正在调试的页面，不用配代理、不用改 hosts，装好扩展就能用
- **页面内生效** — 拦截发生在页面 JavaScript 层面，页面代码感知到的就是改写后的数据，和真实返回一样
- **Fetch 可以不出发服务器** — Mock 模式直接拦截 `fetch()` 调用，请求连网络层都不进，DevTools Network 里也不会出现
- **规则即数据** — 一条 JSON 就是一条规则，导入导出、分享给同事，版本控制友好
- **所见即所得** — 每次命中都有完整的原始/改写对比记录，改了哪里一目了然

---

## 快速上手

<p align="center">
  <em>30 秒创建第一条规则，刷新页面立刻生效</em>
</p>

```bash
# 1. 克隆项目
git clone https://github.com/FutaoSmile/ResponseRewriter.git

# 2. Chrome 打开 chrome://extensions/ → 开启开发者模式 → 加载已解压的扩展程序 → 选择项目目录

# 3. 点击扩展图标，打开管理页面，开始创建规则
```

首次安装自动带入 4 条停用的示例规则和 4 条示例日志，覆盖全部匹配方式和处理模式，不用配就能看懂用法。

---

## 界面预览

<p align="center">
  <img src="./images/规则列表.png" alt="规则列表" width="720">
</p>

**规则列表** — 管理页主界面：规则增删改查、启用/停用、拖拽排序、命中计数一屏搞定。

<p align="center">
  <img src="./images/新增编辑规则.png" alt="新增编辑规则" width="720">
</p>

**新增 / 编辑规则** — 选择 URL 匹配方式与响应处理模式，JSON 实时编辑。

<p align="center">
  <img src="./images/拦截详情.png" alt="拦截详情" width="720">
</p>

**拦截详情** — 每次命中都可展开为原始 → 改写的逐行差异对比，JSON 自动格式化去噪。

<p align="center">
  <img src="./images/数据处理方式确认.png" alt="数据处理方式确认" width="720">
</p>

**数据处理方式确认** — 首次启用拦截前明确说明本地处理的数据范围，征得同意后才安装拦截器。

---

## 四种响应处理方式，按场景选

| 方式 | 你写什么 | 效果 | 什么时候用 |
|---|---|---|---|
| **整段替换** | `{"code":0,"data":{...}}` | 响应完全替换成你写的内容 | 快速 Mock，不看原响应 |
| **JSON 合并** | `{"data":{"role":"admin"}}` | 只覆盖你指定的字段，其余保留 | 只想改某几个字段 |
| **JS 转换** | 一段脚本，可访问 `originalResponse` 和 `context` | 根据原响应动态计算新结果 | 复杂逻辑：加密、拼接、条件替换 |
| **拦截返回** | 一段 JSON | Fetch 不发往服务器，直接返回 | 接口还没写好，不想看到 404 |

```
// JS 转换示例 — 根据原响应和请求信息动态改写
const data = JSON.parse(originalResponse);
data.role = "admin";
data.requestUrl = context.url;
return data;
```

---

## 核心亮点

**拦截日志 + 命中记录，两层视角**

- 全局拦截日志：流式记录每一次拦截事件，方法、时间、规则名称一目了然
- 单条规则命中记录：点击任意规则的命中数，只看它的每一次匹配
- 每个日志可展开为**原始 → 改写**的逐行差异对比，JSON 自动格式化去噪

**URL 匹配三模式**

精确匹配（按路径）、包含匹配（按片段）、正则匹配（动态参数 URL），三种都会忽略查询参数，别担心 `?v=123` 干扰

**规则执行顺序可控**

拖拽排序、`Alt+↑/↓` 键盘排序，多条命中同一请求时按列表顺序依次处理

**暗黑模式、四国语言**

中日英韩完整翻译；点击右上角语言图标选择语言，使用太阳/月亮图标切换浅色与暗黑主题

**零依赖，纯原生实现**

不装 Node 也能用。`node --test` 直接跑 69 项测试，覆盖 UI 模块、规则模型、响应差异格式化、隐私同意与页面通信边界等

---

## 权限说明

Chrome 只申请两个权限，不读取浏览历史、不访问 cookie：

- `storage` — 本地保存规则和日志
- `<all_urls>` — 让注入脚本能在你要调试的页面中运行

首次启用拦截前，扩展会明确说明本地处理的数据并征得同意。只有同意后才会安装 XHR/Fetch 拦截器；命中的请求 URL、请求方法、原始响应和改写后响应仅保存在本机，不会发送给开发者或第三方。详见 [隐私政策](./PRIVACY.md)。

支持 Chrome 114 及以上版本。

---

## 注意事项

- 面向文本响应（JSON 等），不支持二进制
- 日志保留最近 100 条，单条响应最多存 20,000 字符
- JS 转换脚本在页面上下文执行，请只使用自己编写的可信脚本
- 这是开发和测试工具，不建议在包含敏感数据的页面持续启用

完整说明见 [注意事项和限制](#注意事项)。

---

## 参与贡献 · 许可证

欢迎提 Issue 或 PR，保持改动聚焦、延续现有原生 JS 风格。

[MIT License](./LICENSE) · 规则拖拽基于 SortableJS 1.15.7（同样 MIT）
