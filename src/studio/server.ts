/**
 * StreamSmith Embedded Bento Grid Web Studio (Port 6666)
 * Patterns: Bento Grid (#12), Dark Mode (#20), Cybercore (#24), Glassmorphism (#10), Swiss Design (#3)
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import http from 'http';
import { URL } from 'url';
import { inspectLiveStream } from '../simulator/streamClient.js';
import { generateServerConfig } from '../generators/serverGen.js';
import { FrameworkType } from '../types.js';

export function startStudioServer(port: number = 6666): http.Server {
  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);

    // API: Inspect stream endpoint
    if (reqUrl.pathname === '/api/inspect' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const targetUrl = payload.url || 'http://localhost:8088/stream';
          const maxEvents = payload.maxEvents || 30;

          const audit = await inspectLiveStream(targetUrl, { maxEvents });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(audit));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // API: Generate server code
    if (reqUrl.pathname === '/api/generate' && req.method === 'GET') {
      const framework = (reqUrl.searchParams.get('framework') || 'nextjs') as FrameworkType;
      const config = generateServerConfig(framework);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(config));
      return;
    }

    // Serve HTML Studio
    if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderStudioHtml(port));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`\n⚡ StreamSmith Bento Grid Studio active at http://localhost:${port}`);
  });

  return server;
}

export function renderStudioHtml(port: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamSmith Studio | SSE & LLM Stream Inspector</title>
  <style>
    :root {
      --bg: #070a12;
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: #1e293b;
      --border-focus: #38bdf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.35);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #f43f5e;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      padding: 24px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      color: #fff;
      box-shadow: 0 0 16px var(--accent-glow);
    }
    .brand h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: var(--text-muted); }
    .author-badge {
      font-size: 13px;
      color: var(--accent);
      text-decoration: none;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 6px 14px;
      border-radius: 20px;
      transition: all 0.2s;
    }
    .author-badge:hover { background: rgba(56, 189, 248, 0.2); }

    /* Bento Grid (Pattern #12) */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 20px;
    }
    .bento-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    .col-5 { grid-column: span 5; }
    .col-6 { grid-column: span 6; }
    .col-7 { grid-column: span 7; }
    .col-8 { grid-column: span 8; }
    .col-9 { grid-column: span 9; }
    .col-12 { grid-column: span 12; }

    @media (max-width: 1024px) {
      .col-3, .col-4, .col-5, .col-6, .col-7, .col-8, .col-9 { grid-column: span 12; }
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Score Gauge */
    .score-container {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 10px 0;
    }
    .gauge-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
    }
    .gauge-wrapper svg {
      transform: rotate(-90deg);
      width: 120px;
      height: 120px;
    }
    .gauge-bg {
      fill: none;
      stroke: #1e293b;
      stroke-width: 10;
    }
    .gauge-fill {
      fill: none;
      stroke: var(--accent);
      stroke-width: 10;
      stroke-linecap: round;
      stroke-dasharray: 314;
      stroke-dashoffset: 40;
      transition: stroke-dashoffset 1s ease;
    }
    .gauge-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    .gauge-score { font-size: 28px; font-weight: 800; color: #fff; }
    .gauge-label { font-size: 11px; color: var(--text-muted); }
    .grade-badge {
      font-size: 38px;
      font-weight: 900;
      color: var(--success);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      width: 76px;
      height: 76px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    /* Telemetry HUD Cards */
    .metric-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 10px;
    }
    .metric-box {
      background: rgba(3, 7, 18, 0.7);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .metric-val {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .metric-sub {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* Input Controls */
    .form-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    input {
      flex: 1;
      padding: 10px 14px;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    input:focus { border-color: var(--border-focus); }
    .btn {
      background: var(--accent);
      color: #000;
      font-weight: 600;
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn:hover { background: #7dd3fc; box-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }

    /* Chunk Oscilloscope */
    .oscilloscope-canvas {
      height: 90px;
      background: rgba(3, 7, 18, 0.9);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding: 10px;
      overflow-x: auto;
    }
    .chunk-bar {
      width: 14px;
      background: linear-gradient(180deg, #38bdf8, #0284c7);
      border-radius: 3px 3px 0 0;
      min-height: 6px;
      transition: height 0.3s;
      position: relative;
    }
    .chunk-bar:hover { background: #7dd3fc; }

    /* Stream Events Table */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px; color: var(--text-muted); border-bottom: 1px solid var(--card-border); }
    td { padding: 8px 10px; border-bottom: 1px solid rgba(30, 41, 59, 0.5); font-family: ui-monospace, SFMono-Regular, monospace; }
    .status-pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      display: inline-block;
    }
    .status-pill.SAFE { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-pill.WARN { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-pill.FAIL { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }

    /* Code Display */
    pre {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 13px;
      overflow-x: auto;
      color: #e2e8f0;
      max-height: 280px;
    }
    .tabs { display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; }
    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .tab-btn.active { color: var(--accent); background: rgba(56, 189, 248, 0.15); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">🌊</div>
      <div>
        <h1>StreamSmith Studio</h1>
        <p>W3C EventSource & LLM Token Stream Inspector, Latency Oscilloscope & Protocol Linter</p>
      </div>
    </div>
    <a href="https://jatinsh.netlify.app/" target="_blank" class="author-badge">Built by Jatin Sharma</a>
  </header>

  <div class="bento-grid">
    <!-- Card 1: Score & Compliance -->
    <div class="bento-card col-4">
      <div class="card-title">W3C SSE Protocol Posture</div>
      <div class="score-container">
        <div class="gauge-wrapper">
          <svg>
            <circle class="gauge-bg" cx="60" cy="60" r="50"></circle>
            <circle class="gauge-fill" id="gauge-circle" cx="60" cy="60" r="50"></circle>
          </svg>
          <div class="gauge-text">
            <div class="gauge-score" id="score-val">96</div>
            <div class="gauge-label">SCORE</div>
          </div>
        </div>
        <div class="grade-badge" id="grade-val">A+</div>
      </div>
      <div style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 8px;" id="verdict-text">
        Smooth Unbuffered Stream
      </div>
    </div>

    <!-- Card 2: Stream Inspector Controls & Oscilloscope -->
    <div class="bento-card col-8">
      <div class="card-title">
        <span>Live Stream Inspector & Oscilloscope</span>
        <span style="font-size: 11px; color: var(--accent); font-family: monospace;">Real-time Telemetry</span>
      </div>
      <div class="form-row">
        <input type="text" id="target-url" value="http://localhost:8088/stream" placeholder="Enter SSE or LLM Streaming endpoint...">
        <button class="btn" onclick="runInspection()">⚡ Inspect Stream</button>
      </div>
      <div class="oscilloscope-canvas" id="oscilloscope">
        <div class="chunk-bar" style="height: 40px;" title="Chunk 1: 42ms"></div>
        <div class="chunk-bar" style="height: 65px;" title="Chunk 2: 38ms"></div>
        <div class="chunk-bar" style="height: 50px;" title="Chunk 3: 45ms"></div>
        <div class="chunk-bar" style="height: 55px;" title="Chunk 4: 41ms"></div>
        <div class="chunk-bar" style="height: 70px;" title="Chunk 5: 39ms"></div>
        <div class="chunk-bar" style="height: 48px;" title="Chunk 6: 44ms"></div>
        <div class="chunk-bar" style="height: 62px;" title="Chunk 7: 40ms"></div>
        <div class="chunk-bar" style="height: 58px;" title="Chunk 8: 42ms"></div>
      </div>
    </div>

    <!-- Card 3: Stream Performance HUD -->
    <div class="bento-card col-12">
      <div class="card-title">Streaming Performance Telemetry HUD</div>
      <div class="metric-row">
        <div class="metric-box">
          <div class="metric-val" id="metric-ttft">38ms</div>
          <div class="metric-sub">Time to First Token (TTFT)</div>
        </div>
        <div class="metric-box">
          <div class="metric-val" id="metric-tps">42.5</div>
          <div class="metric-sub">Tokens / Sec Rate</div>
        </div>
        <div class="metric-box">
          <div class="metric-val" id="metric-jitter">8.4ms</div>
          <div class="metric-sub">Mean Chunk Jitter</div>
        </div>
        <div class="metric-box">
          <div class="metric-val" id="metric-burst">0.05</div>
          <div class="metric-sub">Burstiness Index (0=Smooth)</div>
        </div>
      </div>
    </div>

    <!-- Card 4: Stream Chunks Table -->
    <div class="bento-card col-6">
      <div class="card-title">Recent Event Chunks Sample</div>
      <div style="max-height: 240px; overflow-y: auto;">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Delta</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody id="events-body">
            <tr>
              <td>evt-1</td>
              <td>message</td>
              <td>0ms</td>
              <td>{"text":"Building"}</td>
            </tr>
            <tr>
              <td>evt-2</td>
              <td>message</td>
              <td>35ms</td>
              <td>{"text":"high-performance"}</td>
            </tr>
            <tr>
              <td>evt-3</td>
              <td>message</td>
              <td>38ms</td>
              <td>{"text":"distributed"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card 5: Heuristics & Protocol Findings -->
    <div class="bento-card col-6">
      <div class="card-title">Protocol & Proxy Audit Findings</div>
      <div id="findings-list" style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
        <div style="background: rgba(3,7,18,0.7); padding: 10px; border-radius: 8px; border-left: 3px solid var(--success);">
          <div style="font-weight: 700; font-size: 13px; color: var(--success);">✔ Valid Content-Type: text/event-stream</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">W3C EventSource MIME type standard satisfied.</div>
        </div>
        <div style="background: rgba(3,7,18,0.7); padding: 10px; border-radius: 8px; border-left: 3px solid var(--success);">
          <div style="font-weight: 700; font-size: 13px; color: var(--success);">✔ X-Accel-Buffering: no Present</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Downstream reverse proxies will not buffer tokens.</div>
        </div>
      </div>
    </div>

    <!-- Card 6: Multi-Framework Server Code Generator -->
    <div class="bento-card col-12">
      <div class="card-title">
        <span>Production-Hardened Streaming Server Generator</span>
        <button class="btn" style="padding: 4px 12px; font-size: 12px;" onclick="copyCode()">Copy Code</button>
      </div>
      <div class="tabs">
        <button class="tab-btn active" onclick="switchFramework('nextjs')">Next.js 14/15</button>
        <button class="tab-btn" onclick="switchFramework('express')">Express.js</button>
        <button class="tab-btn" onclick="switchFramework('fastify')">Fastify</button>
        <button class="tab-btn" onclick="switchFramework('cloudflare_workers')">Cloudflare Workers</button>
        <button class="tab-btn" onclick="switchFramework('hono')">Hono</button>
        <button class="tab-btn" onclick="switchFramework('fastapi')">FastAPI (Python)</button>
      </div>
      <pre id="code-output">// Loading production configuration...</pre>
    </div>
  </div>

  <script>
    let currentFramework = 'nextjs';

    async function switchFramework(fw) {
      currentFramework = fw;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      
      const res = await fetch('/api/generate?framework=' + fw);
      const data = await res.json();
      document.getElementById('code-output').textContent = data.code;
    }

    async function runInspection() {
      const url = document.getElementById('target-url').value;
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (data.error) {
        alert('Inspection error: ' + data.error);
        return;
      }

      // Update score & grade
      document.getElementById('score-val').textContent = data.score;
      document.getElementById('grade-val').textContent = data.grade;
      document.getElementById('verdict-text').textContent = data.proxyBufferingVerdict.explanation;

      // Update metrics
      document.getElementById('metric-ttft').textContent = Math.round(data.metrics.ttftMs) + 'ms';
      document.getElementById('metric-tps').textContent = data.metrics.tokensPerSecond;
      document.getElementById('metric-jitter').textContent = data.metrics.meanInterChunkJitterMs + 'ms';
      document.getElementById('metric-burst').textContent = data.metrics.bufferBurstinessIndex;

      // Update Oscilloscope
      const osc = document.getElementById('oscilloscope');
      osc.innerHTML = '';
      data.eventsSample.forEach(e => {
        const bar = document.createElement('div');
        bar.className = 'chunk-bar';
        const h = Math.min(80, Math.max(10, e.chunkSizeBytes * 1.5));
        bar.style.height = h + 'px';
        bar.title = 'Delta: ' + e.deltaMs + 'ms | Size: ' + e.chunkSizeBytes + 'B';
        osc.appendChild(bar);
      });

      // Update Events Table
      const tbody = document.getElementById('events-body');
      tbody.innerHTML = '';
      data.eventsSample.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${e.id || '-'}</td>
          <td>\${e.event || 'message'}</td>
          <td>\${e.deltaMs}ms</td>
          <td>\${e.data.substring(0, 30)}...</td>
        \`;
        tbody.appendChild(tr);
      });

      // Update Findings
      const findings = document.getElementById('findings-list');
      findings.innerHTML = '';
      data.issues.forEach(iss => {
        const div = document.createElement('div');
        const color = iss.severity === 'CRITICAL' ? 'var(--danger)' : iss.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent)';
        div.style.background = 'rgba(3,7,18,0.7)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.borderLeft = '3px solid ' + color;
        div.innerHTML = \`
          <div style="font-weight: 700; font-size: 13px; color: \${color};">[\${iss.severity}] \${iss.code}: \${iss.title}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">\${iss.description}</div>
          <div style="font-size: 11px; color: var(--accent); margin-top: 4px;">Fix: \${iss.remediation}</div>
        \`;
        findings.appendChild(div);
      });
    }

    function copyCode() {
      const code = document.getElementById('code-output').textContent;
      navigator.clipboard.writeText(code);
      alert('Config copied to clipboard!');
    }

    // Initial load
    switchFramework('nextjs');
  </script>
</body>
</html>`;
}
