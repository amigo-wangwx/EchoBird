<p align="center">
  <img src="docs/icon.png" alt="EchoBird" width="140" />
</p>

<h1 align="center">EchoBird</h1>

<p align="center"><strong>AI deployment, no more chicken-and-egg.</strong></p>
<p align="center"><sub>AI 部署,不再是先有鸡还是先有蛋。</sub></p>

<p align="center">
  <a href="https://github.com/edison7009/EchoBird/releases">
    <img src="https://img.shields.io/github/v/release/edison7009/EchoBird?style=flat-square&color=D97757" alt="Release" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/built%20with-Tauri%20%2B%20Rust-orange?style=flat-square" alt="Tauri + Rust" />
  <img src="https://img.shields.io/github/license/edison7009/EchoBird?style=flat-square" alt="BUSL-1.1 License" />
</p>

<p align="center">
  <a href="https://echobird.ai">Website</a> ·
  <a href="https://github.com/edison7009/EchoBird/releases/latest">Download</a> ·
  <a href="https://echobird.ai/support/">☕ Buy a coffee</a> ·
  <a href="README.zh-CN.md">中文 README</a>
</p>

<p align="center"><sub><em>If EchoBird helped solve a problem, you can <a href="https://echobird.ai/support/">buy the dev a coffee ☕</a>.</em></sub></p>

> **Note** — This repository is a source archive, download channel, and
> issue tracker. For product information, announcements, and commercial
> inquiries, visit [echobird.ai](https://echobird.ai).

---

## What is EchoBird?

Friends kept asking me to install **Claude Code**, **OpenClaw**, **Hermes Agent**… every machine was different, and some refused to pay for an LLM. Setup and explanations took forever. So I built **EchoBird** — an Agent inspired by **Songbird**, the genius netrunner from *Cyberpunk 2077* who solves any tech problem for V…

## Highlights

EchoBird offers **4 scenarios** sharing a **unified model data hub** — **configure once, used everywhere**.

### 4 scenarios

- **Install & Repair Agent** — let an AI install and fix mainstream tools (Claude Code, OpenClaw, Hermes Agent, …); works locally and remotely
- **One-click local LLM** — bundled vLLM / SGLang / llama.cpp runtimes; pick a quant, hit START
- **My AI Projects** — onboard and manage your own vibe-coded apps and games inside EchoBird
- **App Manager** — one-click launch and management for every AI / Agent app & game

### Shared foundation

- **Model Nexus** — a unified data hub for OpenAI / Anthropic / local LLMs / API Routers; configure once and all 4 scenarios pick it up; one-click latency check before you commit

**Cross-platform** — Windows, macOS, Linux (x64 + arm64)

## Screenshots

### AI News & Star Projects — your daily AI brief

> Day & night, side by side — the rest of the screenshots below follow your GitHub theme.

<table>
<tr>
  <td width="50%"><img src="docs/screenshots/news-en-light.png" alt="AI News (Light)" /></td>
  <td width="50%"><img src="docs/screenshots/news-en-dark.png" alt="AI News (Dark)" /></td>
</tr>
<tr>
  <td align="center"><sub>☀️ Light theme</sub></td>
  <td align="center"><sub>🌙 Dark theme</sub></td>
</tr>
</table>

### Model Nexus — the unified model data hub, configure once

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/model-en-dark.png">
  <img alt="Model Nexus" src="docs/screenshots/model-en-light.png" width="100%">
</picture>

### App Manager — one-click launch and management for every AI / Agent app

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/app-en-dark.png">
  <img alt="App Manager" src="docs/screenshots/app-en-light.png" width="100%">
</picture>

### Local LLM — run models on your own machine

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/localllm-en-dark.png">
  <img alt="Local LLM" src="docs/screenshots/localllm-en-light.png" width="100%">
</picture>

### Install & Repair Agent — chat-driven setup and troubleshooting

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/agent-en-dark.png">
  <img alt="Install & Repair Agent" src="docs/screenshots/agent-en-light.png" width="100%">
</picture>

## Install

### One-line install

**Windows** (PowerShell)

```powershell
irm https://echobird.ai/install.ps1 | iex
```

**macOS / Linux**

```sh
curl -fsSL https://echobird.ai/install.sh | sh
```

The script auto-detects your OS, downloads the right package, and skips if you're already on the latest version.

### Or download a package

Latest release → <https://github.com/edison7009/EchoBird/releases/latest>

| Platform | Asset |
|---|---|
| Windows x64 | `EchoBird_<ver>_Windows_x64-setup.exe` |
| macOS (Apple Silicon) | `EchoBird_<ver>_macOS_arm64.dmg` |
| Linux x64 · Debian/Ubuntu | `EchoBird_<ver>_Linux_x64.deb` |
| Linux arm64 · Debian/Ubuntu | `EchoBird_<ver>_Linux_arm64.deb` |
| Linux x64 · Fedora/RHEL | `EchoBird_<ver>_Linux_x64.rpm` |
| Linux arm64 · Fedora/RHEL | `EchoBird_<ver>_Linux_arm64.rpm` |

## License & Trademarks

**Code** — EchoBird **v5.0.0 and later** are licensed under the
[Business Source License 1.1 (BUSL-1.1)](LICENSE). Source is published for
transparency, audit, personal use, and honest forks. Production
redistribution as a multi-LLM client product, hosted-service operation,
or substantially overlapping derivative product requires a commercial
license — see the Additional Use Grant in [LICENSE](LICENSE) for the
precise scope. Each v5.x version auto-converts to GPL-2.0-or-later four
years after its publication date. EchoBird **v4.x and earlier** remain
under AGPL-3.0-or-later in perpetuity. See [NOTICE](NOTICE) for attribution.

**Trade dress + brand** — EchoBird's primary protection is its **UI / UX trade
dress**: the specific combination of four user-facing surfaces sharing one
central model hub, plus the bundling of two complete reference applications
(Reversi + AI Translator) as user tutorial templates. The wordmark **EchoBird**
is a common-law trademark of edison7009; feature labels like *Model Nexus* /
*模型中心* are descriptive and protected only as part of the trade dress.
**Forks are welcome — no need to scrub our name and logo.** If your fork
honestly credits EchoBird as upstream, you may keep our identity visible
(e.g. "EchoBird Community Edition by X"). If you prefer to rebrand entirely,
that's also fine — just keep the NOTICE attribution. The hard lines are:
**commercial SaaS / app-store products literally branded "EchoBird"**
without permission; **presenting the code as your own from-scratch original
work**; and **adopting three or more of our four UI surfaces side-by-side in
a competing product without independent prior-work documentation** (see
[NOTICE](NOTICE) for the formal threshold). See [TRADEMARKS.md](TRADEMARKS.md)
for the full policy.

---

<p align="center">
  Made with 💚 by EchoBird Team<br>
  <sub>⭐ <a href="https://github.com/edison7009/EchoBird">Star on GitHub</a> · <a href="README.zh-CN.md">中文文档</a></sub>
</p>
