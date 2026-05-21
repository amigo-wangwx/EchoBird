# EchoBird Trademark & Trade Dress Policy / 商标与商业外观政策

> **Plain-English summary / 一句话**: EchoBird's primary defense is its
> **UI / UX trade dress** — the specific way four user-facing surfaces
> share one central model hub, and the unique pattern of bundling two
> complete reference applications as the user's tutorial. Brand-name
> trademarks (EchoBird, Model Nexus / 模型中心) are the secondary,
> traditional layer. Forks are welcome — honest attribution is enough.
> The hard line is copying multiple UI surfaces side-by-side without
> documented independent prior work.
>
> EchoBird 的**首要保护**是 **UI / UX 商业外观(trade dress)** —— 四个
> 用户界面与中央模型枢纽的关系,以及在产品里**嵌两个完整开源 AI 应用
> 作为用户教程模板** 这种前无古人的具体做法。**商标名字**(EchoBird、
> Model Nexus / 模型中心)是次要的、传统的那一层。Fork 欢迎 —— 诚实标
> 注上游即可。硬底线只有一条:**在没有独立留存先创证据的情况下,在同
> 一个产品里并列采用多个 EchoBird UI 界面**。

---

## English

### 1. What we claim, in two layers

EchoBird claims protection on two distinct legal layers, listed in
order of strategic importance:

**Layer A — UI / UX trade dress (primary).**
The "look and feel" of four interrelated user-facing surfaces and the
specific way they share one central model data hub. This is the layer
that actually defends against product-format imitation. See §3 below
for the full timeline and §4 for the specific creative points; the
formal trade-dress declaration with the "three-or-more" threshold lives
in [NOTICE](NOTICE).

**Layer B — Brand-name trademarks (secondary).**
The names *EchoBird* and *Model Nexus* / *模型中心* are claimed as
common-law trademarks of edison7009 based on first use. See §6 below.

We are explicit about the ordering because EchoBird's true originality
is in the **product format** — the specific UI surfaces and their
relationships — not in the wordmarks. A theoretical competitor who
copied our product format under a completely different brand name
would still infringe Layer A.

### 2. License posture (so the open-source picture is clear)

The publicly hosted EchoBird repository is licensed under
[AGPL-3.0-or-later](LICENSE). The Rust core (`echobird_core`) ships as
a vendored dependency under the same license; its source for a given
release is available on request via GitHub issue with the
`source-request` label, per AGPL §6. The "trade dress" and "brand"
protections discussed in this document are **not** waived by the
open-source license — they govern brand identity and product format,
which are outside the scope of any code license.

### 3. The four UI surfaces — timeline and relationships

EchoBird's day-one public commit on **2026-03-02** (`546a14ae`)
shipped *three* distinct user-facing surfaces together in a single
Tauri desktop binary. No earlier product is known to have combined
these three surfaces in one application:

| Day | Commit | Surface | Lines |
|---|---|---|---|
| **2026-03-02** | `546a14ae` | **App Manager** (`src/pages/AppManager.tsx`) | 674 |
| **2026-03-02** | `546a14ae` | **LocalServer / 一键本地大模型** (`src/pages/LocalServer.tsx`) | 1102 |
| **2026-03-02** | `546a14ae` | **Mother Agent / 安装与修复** (`src/pages/MotherAgent.tsx`) | 1410 |

Twenty-four days later, the **central data hub** that connects all
three surfaces was formalized:

| **2026-03-26** | `1ae49436` | **Model Nexus / 模型中心** (consolidated as a dedicated page; underlying data layer present since `546a14ae`) | — |

Seventy-nine days after day one, the **fourth user-facing surface**
shipped, on the same calendar day that the most prominent visual
imitator (`marvis.qq.com`) launched publicly:

| **2026-05-20** | `05a35d13` | **My AI Projects / 我的AI项目** (`src/pages/MyProjects/`) — bundled with two complete reference applications (Reversi + AI Translator) as user-tutorial templates | — |

**Relationship diagram:**

```
                       ┌─────────────────────┐
                       │   Model Nexus       │
                       │   (central pool)    │
                       └──────────┬──────────┘
                                  │ one configuration drives all four
        ┌─────────────┬───────────┼───────────┬─────────────┐
        ▼             ▼           ▼           ▼             ▼
   ┌─────────┐  ┌──────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐
   │  App    │  │ Local    │ │ Mother  │ │ My AI     │ │ (any future  │
   │ Manager │  │ Server   │ │ Agent   │ │ Projects  │ │ scenario)    │
   └─────────┘  └──────────┘ └─────────┘ └───────────┘ └──────────────┘
   2026-03-02   2026-03-02   2026-03-02   2026-05-20    — extensible —
```

The "configure once, used everywhere" relationship between Model Nexus
and the four user-facing surfaces — including the **specific UI grammar
shared between App Manager and My AI Projects** (same card-grid +
right-panel container, same ToolCard component, same model-apply flow)
— is the product-level originality being claimed.

### 4. The reference-app pattern — the most unprecedented piece

When My AI Projects shipped on 2026-05-20, EchoBird did something no
other AI-tool manager has done before or since:

**It bundled two complete, real, runnable open-source AI applications
into the product binary as the user's tutorial templates.**

- **Reversi (黑白棋)** — a complete AI-vs-AI Othello game, source at
  `public/tools/reversi.html` and `tools/reversi/`, with its own
  `models.json` exposed for the user to inspect.
- **AI Translator (AI 翻译)** — a complete real-time bilingual
  translator, source at `public/tools/translator.html` and
  `tools/translator/`, with its own `models.json` exposed.

These reference applications are NOT marketing demos. They are NOT
"hello world" samples. They are **complete, working applications**
whose source code IS the user's tutorial: the user reads Reversi's
`models.json`, understands the four-field convention
(`modelId` / `baseUrl` / `anthropicUrl` / `apiKey`), and applies the
same pattern to their own vibe-coded application — at which point that
application becomes a first-class card in My AI Projects alongside
Reversi and AI Translator.

No prior art is known for any of the following:

- An AI-tool desktop manager that ships **complete real applications**
  as user-tutorial templates rather than as marketing demos.
- A unified `models.json` convention that lets a user's own app be
  registered into the desktop manager identically to a built-in app.
- The combination of (a) reference-app-as-template, (b) shared card
  container between official and user-defined entities, and
  (c) central Model Nexus pool feeding both.

This entire pattern is claimed as EchoBird-originated trade dress with
priority from 2026-05-20.

### 5. Combined trade-dress threshold (formal version in NOTICE)

[NOTICE](NOTICE) section "COMBINED TRADE DRESS NOTICE" sets the formal
threshold: **three or more** of the four UI surfaces in §3, adopted
side-by-side in a single competing desktop application, raises a
presumption of derivation from EchoBird's trade dress unless the
implementer can produce independently-documented prior work. A single
isolated pattern, by itself, is not treated as infringement.

### 6. Brand marks claimed (Layer B)

The following names and logos are claimed as common-law trademarks of
edison7009, based on first use in commerce:

| Mark                            | First public use | Class of goods/services                          |
| ------------------------------- | ---------------- | ------------------------------------------------ |
| **EchoBird** (word mark)        | 2026-03-02       | Computer software; AI agent integration platform |
| **Model Nexus** / **模型中心**  | 2026-03-26       | Software UI feature; unified model data hub      |

Common-law rights apply automatically in jurisdictions that recognize
them (US, UK, Canada, Australia, Hong Kong, …). In first-to-file
jurisdictions (mainland China, EU, Japan), formal registration is
pursued as resources permit; pending that, this document and the
public commit record serve as prior-use evidence.

### 7. Permitted uses (no permission required)

You may, without prior permission:

- Refer to EchoBird factually in articles, blog posts, tutorials,
  conference talks, or academic papers
  (e.g., "I used EchoBird to manage my AI tools").
- State compatibility in your own software
  (e.g., "Plugin for EchoBird", "Imports EchoBird `models.json`"),
  provided your software is not itself confusingly named.
- Distribute unmodified binaries built from this repository with the
  original marks and trade dress intact.

### 8. Uses that require permission

You must obtain written permission before:

- Using EchoBird's wordmark, logo, or distinctive trade dress in paid
  advertising, app-store listings, merchandise, or other commercial
  product marketing. Non-commercial fork attribution per §10 Option A
  does not require permission.
- Operating a commercial SaaS or hosted service that uses any of the
  marks as its headline brand.
- Registering any of the marks, or confusingly similar variants, as
  trademarks, domain names, company names, or product names in any
  jurisdiction.
- Re-implementing three or more of the §3 UI surfaces side-by-side in
  a competing product without independently-documented prior work
  (see [NOTICE](NOTICE)).

### 9. Why this document exists

Open-source licenses govern code. Trademark protects names. **Neither
protects product format.** Without a separate trade-dress declaration,
a competitor can legally write fresh code under a different brand name
and ship a 1:1 visual copy of EchoBird — the same trap ICQ fell into
in the late 1990s. This document closes that gap by documenting prior
art with concrete first-use evidence, before any dispute arises.

### 10. Forks — how to handle naming and UI

If you fork EchoBird and intend to distribute the fork, choose **one
of two paths**.

**Option A — Keep our identity visible (preferred)**

1. Use a name that clearly indicates derivation: "EchoBird Community
   Edition by X", "X-fork of EchoBird", "EchoBird Plus" — prefixes and
   suffixes on the mark are allowed.
2. You may keep our logo and UI trade dress visible; add your own
   co-marks if you wish.
3. In the product README, About screen, or main product page,
   prominently link to the upstream:
   `Based on EchoBird by edison7009 — https://echobird.ai`.
4. Keep AGPL-3.0 LICENSE, NOTICE, and this TRADEMARKS.md intact.

**Option B — Rebrand entirely**

1. Change the product name to something clearly distinct.
2. Replace the logo and adapt the UI surfaces (this is fine; trade
   dress under Option B is your own).
3. Update user-facing strings in `src/`.
4. Keep AGPL-3.0 LICENSE, NOTICE, and TRADEMARKS.md intact, and add
   one line in NOTICE crediting EchoBird as the upstream codebase.

**Both options share one absolute red line**: do not present the
combined product format as your own from-scratch original work. The
specific combination of the four UI surfaces, their shared Model
Nexus spine, and the reference-app-as-template pattern is EchoBird's
trade dress regardless of which fork option you choose. Add genuinely
new surfaces on top? Those are your own.

### 11. Contact

Trademark questions, permission requests, infringement reports, and
AGPL §6 source requests for `echobird_core`: open an issue at
<https://github.com/edison7009/EchoBird/issues>. Suggested labels:
`trademark`, `trade-dress`, `source-request`.

---

## 简体中文

### 1. 我们在两个法律层面主张权利

EchoBird 在两个法律层面主张保护,按战略重要性排序:

**A 层 —— UI / UX 商业外观(主防线)**
四个用户面向界面之间的关系,以及它们如何共享一个中央模型枢纽,
构成 EchoBird 的「整体形态与感觉(trade dress)」。这是真正能对抗
**产品形态抄袭**的那一层。详见 §3 时间线 + §4 创意点 + §5 阈值。
正式的「三项或以上」侵权阈值声明在 [NOTICE](NOTICE) 文件中。

**B 层 —— 品牌商标(辅助)**
*EchoBird* 与 *Model Nexus* / *模型中心* 作为 edison7009 的普通法
商标,基于「商业中首次使用」原则主张权利。详见 §6。

我们**明确把 A 层放在 B 层之前** —— 因为 EchoBird 真正的原创性在
**产品形态**,不在文字商标。假设有人完全改名换 Logo 但 1:1 复制我们
的产品形态,他依然侵犯 A 层。

### 2. 开源协议态(把图说清楚)

EchoBird 公共仓采用 [AGPL-3.0-or-later](LICENSE) 协议。Rust 核心
(`echobird_core`)作为 vendored 依赖,同协议授权;**每个 release
对应版本的 echobird_core 源码可按 AGPL §6 请求获取** —— 在 GitHub
Issues 提交带 `source-request` 标签的请求即可。本文档讨论的「商业外观」
和「商标」保护**不**因开源协议而放弃 —— 它们管的是品牌与产品形态,
超出任何代码协议的范畴。

### 3. 四个 UI 界面 —— 时间线与关系

EchoBird **首日公开 commit**(2026-03-02,`546a14ae`)在同一个 Tauri
桌面二进制里**同时**发布了**三个**独立的用户面向界面。在此之前,**没有
已知产品**把这三个界面集合在同一个应用里:

| 日期 | Commit | 界面 | 代码行 |
|---|---|---|---|
| **2026-03-02** | `546a14ae` | **应用管理 / App Manager**(`src/pages/AppManager.tsx`) | 674 |
| **2026-03-02** | `546a14ae` | **一键本地大模型 / LocalServer**(`src/pages/LocalServer.tsx`) | 1102 |
| **2026-03-02** | `546a14ae` | **安装与修复 / Mother Agent**(`src/pages/MotherAgent.tsx`) | 1410 |

24 天后,串联以上三个界面的**中央数据枢纽**被正式抽象出来:

| **2026-03-26** | `1ae49436` | **模型中心 / Model Nexus**(独立页面;底层数据自 `546a14ae` 已存在) | — |

距离首日发布 79 天后,**第四个用户面向界面**发布 —— 恰好是最显著的
视觉模仿者(`marvis.qq.com`)公开上线的同一天:

| **2026-05-20** | `05a35d13` | **我的AI项目 / My AI Projects**(`src/pages/MyProjects/`) —— 内置两个完整可运行的参考应用(黑白棋 + AI 翻译)作为用户教程模板 | — |

**关系示意图:**

```
                       ┌─────────────────────┐
                       │   Model Nexus       │
                       │   中央模型池        │
                       └──────────┬──────────┘
                                  │  一处配置,四处生效
        ┌─────────────┬───────────┼───────────┬─────────────┐
        ▼             ▼           ▼           ▼             ▼
   ┌─────────┐  ┌──────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐
   │  应用    │  │ 本地大   │ │ 安装与  │ │ 我的 AI   │ │  (未来场景)  │
   │  管理    │  │ 模型     │ │ 修复    │ │ 项目      │ │              │
   └─────────┘  └──────────┘ └─────────┘ └───────────┘ └──────────────┘
   2026-03-02   2026-03-02   2026-03-02   2026-05-20    — 可扩展 —
```

「**一处配置,四处生效**」—— Model Nexus 与四个用户面向界面之间的这种
**主从结构**,以及**应用管理与我的 AI 项目共享同一种 UI 语法**(同样的
卡片网格 + 右侧详情面板容器、同样的 ToolCard 组件、同样的模型应用流),
是我们主张的**产品级原创**。

### 4. 参考应用模板模式 —— 最前无古人的一笔

2026-05-20 我的 AI 项目发布时,EchoBird 做了一件**此前没有任何 AI 工具
管理器做过的事**:

**把两个完整的、可运行的、开源的 AI 应用,直接打进产品里,作为用户的
教程模板。**

- **黑白棋(Reversi)** —— 一个完整的 AI-vs-AI 黑白棋游戏,源码在
  `public/tools/reversi.html` 与 `tools/reversi/`,其 `models.json`
  公开可见供用户阅读。
- **AI 翻译(AI Translator)** —— 一个完整的实时双语翻译应用,源码在
  `public/tools/translator.html` 与 `tools/translator/`,其 `models.json`
  公开可见。

这两个参考应用**不是营销 demo**,**不是 hello world 样例**。它们是
**完整的、能跑的真应用**,**它们的源码就是用户的教程** —— 用户读
黑白棋的 `models.json`,理解四字段约定(`modelId` / `baseUrl` /
`anthropicUrl` / `apiKey`),把同样的模式应用到自己 vibe-coded 的应用
上,他的应用立刻就以一张**与黑白棋、AI 翻译并列**的卡片身份注册到「我的
AI 项目」面板里。

**以下组合无任何已知先例:**

- 一个 AI 工具桌面管理器,把**完整可运行的真应用**作为用户教程模板内嵌
  发布,而不是用营销 demo
- 统一的 `models.json` 约定,让用户自己写的 AI 应用能用与内置应用**完
  全相同的方式**注册进桌面管理器
- (a)参考应用作教程模板 + (b)官方工具与用户自定义实体共用同一卡片
  容器 + (c)中央 Model Nexus 池供两者共享 —— **这三件事的组合**

整套模式作为 EchoBird 首创的 trade dress 主张,优先权日 **2026-05-20**。

### 5. 整体商业外观侵权阈值(正式版在 NOTICE)

[NOTICE](NOTICE) 中的「整体商业外观声明」设定正式阈值:**在同一个竞争性
桌面应用中并列采用 §3 所列四个 UI 界面中的三个或更多**,在该实施方无法
出示独立留存的更早原创证据的情况下,推定为对 EchoBird 商业外观的衍生
使用。**单独采用其中某一项**本身不视为侵权。

### 6. 主张的商标(B 层)

以下名称、标识与 Logo 作为 edison7009 的普通法商标,基于「商业中首次
使用」原则主张:

| 标识                            | 首次公开使用 | 商品/服务类别              |
| ------------------------------ | ------------ | ------------------------- |
| **EchoBird**(文字商标)        | 2026-03-02   | 计算机软件;AI Agent 集成平台 |
| **Model Nexus** / **模型中心** | 2026-03-26   | 软件 UI 功能;统一模型数据枢纽 |

普通法商标权在承认该制度的法域(美、英、加、澳、香港等)凭「商业中
首次使用」自动产生。在中国大陆、欧盟、日本等先申请制法域,本项目将在
资源允许时申请正式注册;在未注册期间,本文档与公开 commit 历史共同作为
先用证据存档。

### 7. 无需许可的使用方式

以下使用**无需事先获得授权**:

- 在文章、博客、教程、会议演讲、学术论文中**事实性引用**项目名称
  (例:"我用 EchoBird 管理 AI 工具")。
- 在你自己的软件中**声明兼容性**(例:"EchoBird 插件"、"导入 EchoBird
  `models.json`"),前提是你的软件本身命名不会引起混淆。
- **分发由本仓库直接构建的未修改二进制**,保留原始标识与商业外观。

### 8. 必须获得许可的使用方式

以下行为**必须**事先获得书面许可:

- 在**付费广告、应用商店上架、周边商品或其他商业产品宣传**中使用
  EchoBird 的文字商标、Logo 或独特商业外观。非商业 fork 在 README /
  About 页面按 §10 方案 A 署名**无需**授权。
- 运营**字面挂任何标识作为头牌品牌**的商业 SaaS 或托管服务。
- 在任何法域将任何标识(或近似变体)注册为**商标、域名、公司名或
  产品名**。
- 在没有独立留存先创证据的情况下,在一个竞争性产品中**并列实现 §3 所
  列三个或更多 UI 界面**(详见 [NOTICE](NOTICE))。

### 9. 为什么需要这份文档

开源协议管**代码**,商标管**名字**,**两者都不管产品形态**。没有独立的
商业外观声明,竞争者完全可以合法地:用全新代码、换名字、换 Logo,**1:1
视觉复刻 EchoBird**。这正是 ICQ 在 1990 年代末踩过的坑 —— 代码原创、
商标不同、UI 一模一样,法庭无能为力。本文档在任何争议发生**之前**,
以具体的先用证据落档,堵住这个口子。

### 10. Fork 时如何处理命名与 UI

若你 fork 本项目并打算分发,**两条路任选其一**。

**方案 A —— 保留我们的身份可见(推荐)**

1. 使用**清晰表明派生关系**的名字:"EchoBird 社区版 by X"、
   "X-fork of EchoBird"、"EchoBird Plus" —— 在本方案下允许在原标识前后
   加前缀/后缀。
2. 你可以保留我们的 Logo 与 UI 商业外观;愿意叠加你自己的标识也可以。
3. 在产品 README、关于页面或产品主页**显著位置**注明上游链接:
   `基于 EchoBird by edison7009 — https://echobird.ai`。
4. 保留 AGPL-3.0、NOTICE 与本 TRADEMARKS.md 原貌。

**方案 B —— 完全重新品牌化**

1. 更改产品名称为显著区别的名字。
2. 替换 Logo 并改造 UI 界面(可以;方案 B 下你的 UI 商业外观归你)。
3. 更新 `src/` 中的用户可见字符串。
4. 保留 AGPL-3.0、NOTICE 与 TRADEMARKS.md 原貌,并在 NOTICE 中明确
   添加一行致谢 EchoBird 作为代码上游来源。

**两个方案的共同红线**:不要把**整套产品形态**当作你从零设计的原创。
四个 UI 界面 + Model Nexus 主轴 + 参考应用模板模式的**整套组合**,
不论你选哪个方案,都是 EchoBird 的商业外观。你在此基础之上**新增的
原创界面归你**。

### 11. 联系方式

商标问题、授权申请、侵权举报、`echobird_core` 的 AGPL §6 源码请求:
在 <https://github.com/edison7009/EchoBird/issues> 提交。建议标签:
`trademark` / `trade-dress` / `source-request`。

---

*Last updated / 最后更新: 2026-05-22*
*This policy is non-binding promotional language; the AGPL-3.0 LICENSE
file governs code use, and the NOTICE file is the formal trade-dress
declaration. This document tells the story behind both.*
