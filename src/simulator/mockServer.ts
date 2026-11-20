/**
 * StreamSmith Zero-Token Mock LLM & SSE Streaming Server
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import http from 'http';
import { URL } from 'url';
import { MockStreamOptions } from '../types.js';

export const SAMPLE_TECH_TEXT = [
  "Building", "high-performance", "distributed", "systems", "requires",
  "careful", "attention", "to", "network", "backpressure,", "latency",
  "percentiles,", "and", "connection", "lifecycle", "management.",
  "Server-Sent", "Events", "(SSE)", "provide", "an", "elegant",
  "unidirectional", "transport", "for", "streaming", "real-time",
  "generative", "AI", "tokens", "directly", "to", "modern", "web",
  "interfaces", "with", "minimal", "framing", "overhead."
];

export function startMockStreamServer(
  port: number = 8088,
  defaultOptions: MockStreamOptions = {}
): http.Server {
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);

    if (reqUrl.pathname === '/stream' || reqUrl.pathname === '/v1/chat/completions') {
      const dialect = (reqUrl.searchParams.get('dialect') as any) || defaultOptions.dialect || 'openai';
      const tps = parseInt(reqUrl.searchParams.get('speed') || '', 10) || defaultOptions.tokensPerSecond || 40;
      const delayMs = Math.max(5, Math.round(1000 / tps));
      const jitter = parseInt(reqUrl.searchParams.get('jitter') || '', 10) || defaultOptions.chunkJitterMs || 10;
      const disconnectAfter = parseInt(reqUrl.searchParams.get('disconnect') || '', 10) || defaultOptions.simulateDisconnectionAfter || 0;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Last-Event-ID',
        'Access-Control-Expose-Headers': 'Content-Type'
      });

      if (res.flushHeaders) {
        res.flushHeaders();
      }

      // Initial retry directive
      res.write('retry: 3000\n\n');

      let wordIndex = 0;
      let eventCount = 0;
      const intervalTimer = setInterval(() => {
        if (disconnectAfter > 0 && eventCount >= disconnectAfter) {
          clearInterval(intervalTimer);
          res.destroy(); // Abrupt disconnect
          return;
        }

        if (wordIndex >= SAMPLE_TECH_TEXT.length) {
          // Stream termination
          if (dialect === 'openai') {
            res.write('data: [DONE]\n\n');
          } else if (dialect === 'anthropic') {
            res.write('event: message_stop\ndata: {"type":"message_stop"}\n\n');
          } else {
            res.write('event: done\ndata: {"status":"complete"}\n\n');
          }
          clearInterval(intervalTimer);
          res.end();
          return;
        }

        const word = SAMPLE_TECH_TEXT[wordIndex++];
        eventCount++;
        const id = `evt-${eventCount}`;

        let chunk = '';
        if (dialect === 'openai') {
          const payload = JSON.stringify({
            id: 'chatcmpl-mock',
            object: 'chat.completion.chunk',
            choices: [{ delta: { content: word + ' ' }, index: 0, finish_reason: null }]
          });
          chunk = `id: ${id}\ndata: ${payload}\n\n`;
        } else if (dialect === 'anthropic') {
          const payload = JSON.stringify({
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: word + ' ' }
          });
          chunk = `event: content_block_delta\nid: ${id}\ndata: ${payload}\n\n`;
        } else if (dialect === 'gemini') {
          const payload = JSON.stringify({
            candidates: [{ content: { parts: [{ text: word + ' ' }] } }]
          });
          chunk = `id: ${id}\ndata: ${payload}\n\n`;
        } else {
          // Raw
          chunk = `id: ${id}\nevent: token\ndata: ${word} \n\n`;
        }

        res.write(chunk);
      }, delayMs);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(intervalTimer);
      });
      return;
    }

    if (reqUrl.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: 'StreamSmith Mock Engine' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found. Use /stream or /v1/chat/completions');
  });

  server.listen(port, () => {
    console.log(`✔ StreamSmith Mock SSE Engine active on http://localhost:${port}/stream`);
  });

  return server;
}
