# 🌊 StreamSmith

> **Developer-First Server-Sent Events (SSE) & LLM Stream Simulator, Protocol Linter, Chunk Inspector & Bento Grid Studio.**  
> Built by **[Jatin Sharma](https://jatinsh.netlify.app/)** (`raghav1924`).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0_Runtime-emerald.svg)]()
[![Design System](https://img.shields.io/badge/Design_Patterns-Bento_Grid_%2312_%7C_Dark_Mode_%2320_%7C_Cybercore_%2324-cyan.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 The Developer Problem

Server-Sent Events (SSE) are the foundational transport for AI token streaming (OpenAI, Anthropic, Gemini, Vercel AI SDK), real-time dashboards, and agentic workflows. However, production streaming is plagued by tricky bugs:
1. **Proxy Buffering (`SSE-002`)**: Nginx (`proxy_buffering on`), Cloudflare, and cloud load balancers buffer streaming chunks into 4KB/8KB packets, transforming smooth streaming into stuttering token bursts.
2. **Missing `X-Accel-Buffering: no`**: Intermediate reverse proxies fail to recognize streaming responses and queue output.
3. **Idle Heartbeat Timeouts (`SSE-006`)**: AWS ALB and Cloudflare drop idle connections after 60-100 seconds if periodic keep-alive comments (`: ping\n\n`) are omitted.
4. **Resumption Failures (`SSE-007`)**: Unindexed streams omit event `id:` fields, making client reconnection with `Last-Event-ID` impossible during momentary network drops.
5. **Cost of Frontend Testing**: Developers burn expensive LLM tokens simply verifying frontend markdown renderers and streaming UI widgets.

**StreamSmith** provides an all-in-one developer toolchain: a W3C EventSource parser, proxy buffering detector, zero-token mock LLM streaming engine, multi-framework server code generator, and an embedded **Bento Grid Web Studio**.

---

## 🎨 Master Design Patterns (from `DESIGN_INSPIRATION.md`)

* **Pattern #12: Bento Grid**: Asymmetric compartmentalized cards grouping protocol posture, live chunk oscilloscope, real-time telemetry HUD, and code generators.
* **Pattern #20: High-Contrast Dark Mode**: Deep obsidian canvas (`#070a12`), slate borders (`#1e293b`), and glowing status accents.
* **Pattern #24: Cybercore Telemetry HUD**: High-precision token rate meters, inter-chunk jitter counters, and burstiness indices.
* **Pattern #10: Glassmorphism**: Frosted translucent card panels with diffused backdrop filters.
* **Pattern #3: Swiss Design Discipline**: Clean typographic hierarchy, strict grid alignment, and asymmetric balance.

---

## ⚡ Core Features

* **🛡️ 14+ Protocol & Security Heuristics**: Detects missing MIME types, proxy buffering traps, caching headers, idle heartbeat gaps, missing event IDs, and TTFT bottlenecks.
* **📊 Time-to-First-Token (TTFT) & Jitter Analysis**: Measures exact millisecond latency to the first token and computes inter-chunk variance.
* **📈 Burstiness Index & Buffering Detection**: Detects whether chunks arrive in smooth increments or bulk packet bursts.
* **🤖 Zero-Token Mock LLM Server**: Emulates **OpenAI**, **Anthropic**, **Gemini**, and **Raw SSE** endpoints locally with configurable token speeds (10-200 tokens/sec) and mid-stream disconnect testing.
* **⚙️ Multi-Framework Server Code Generator**: One-click generation of hardened streaming handlers for **Next.js 14/15 App Router**, **Express**, **Fastify**, **Cloudflare Workers**, **Hono**, and **FastAPI (Python)**.
* **🌊 Embedded Bento Grid Web Studio (Port 6666)**: Interactive browser UI with circular SVG compliance gauges, live chunk oscilloscope, and event inspectors.
* **🚀 Zero External Dependencies**: 100% native TypeScript 5.9 and Node.js (`http`, `https`, `url`, `perf_hooks`, `events`).

---

## 📦 Installation & Usage

```bash
# Run studio directly
npx streamsmith studio

# Or install globally
npm install -g streamsmith
```

### CLI Commands

```bash
# Start zero-token mock LLM streaming server on port 8088
streamsmith mock --port 8088 --dialect openai --speed 50

# Inspect and audit any live SSE / LLM stream
streamsmith inspect http://localhost:8088/stream

# Run CI/CD quality gate (exits with code 1 if score < 70 or critical issue found)
streamsmith audit https://api.example.com/v1/chat/completions --ci

# Generate production-hardened server middleware
streamsmith generate --framework nextjs
streamsmith generate --framework express
streamsmith generate --framework fastify
streamsmith generate --framework cloudflare_workers
streamsmith generate --framework hono
streamsmith generate --framework fastapi

# Launch Bento Grid Studio
streamsmith studio --port 6666
```

---

## 🛠️ Programmatic API

```typescript
import { EventStreamParser, inspectLiveStream, startMockStreamServer } from 'streamsmith';

// Start mock server
const server = startMockStreamServer(8088, { dialect: 'openai', tokensPerSecond: 60 });

// Inspect stream
const audit = await inspectLiveStream('http://localhost:8088/stream', { maxEvents: 20 });
console.log(`Score: ${audit.score}/100 (Grade: ${audit.grade})`);
console.log(`TTFT: ${audit.metrics.ttftMs}ms | Tokens/Sec: ${audit.metrics.tokensPerSecond}`);
console.log(`Proxy Buffered: ${audit.proxyBufferingVerdict.buffered}`);
```

---

## 🧪 Test Suite

```bash
npm test
```
All 18 unit and integration tests run in $<300\text{ms}$ with zero external testing dependencies.

---

## 👤 Author

**Jatin Sharma (`raghav1924`)**
* Website: [https://jatinsh.netlify.app/](https://jatinsh.netlify.app/)
* GitHub: [@raghav1924](https://github.com/raghav1924)
* Email: [raghavjatin245@gmail.com](mailto:raghavjatin245@gmail.com)

---

## 📄 License

MIT License © 2026 Jatin Sharma.
