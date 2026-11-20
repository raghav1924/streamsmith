/**
 * StreamSmith SSE Stream Consumer & Live Auditor Client
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import { EventStreamParser } from '../core/parser.js';
import { calculateStreamMetrics } from '../core/metrics.js';
import { lintEventStream } from '../core/linter.js';
import { StreamAuditResult, SSEEvent } from '../types.js';

export interface InspectOptions {
  maxEvents?: number;
  timeoutMs?: number;
  lastEventId?: string;
  customHeaders?: Record<string, string>;
}

export async function inspectLiveStream(
  targetUrl: string,
  options: InspectOptions = {}
): Promise<StreamAuditResult> {
  const maxEvents = options.maxEvents || 40;
  const timeoutMs = options.timeoutMs || 10000;

  const parsedUrl = new URL(targetUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const reqHeaders: Record<string, string> = {
    'Accept': 'text/event-stream',
    'User-Agent': 'StreamSmith/1.0.0 (https://github.com/raghav1924/streamsmith)',
    ...(options.customHeaders || {})
  };

  if (options.lastEventId) {
    reqHeaders['Last-Event-ID'] = options.lastEventId;
  }

  return new Promise<StreamAuditResult>((resolve, reject) => {
    const startTimeMs = Date.now();
    const parser = new EventStreamParser();
    const collectedEvents: SSEEvent[] = [];
    let receivedHeaders: Record<string, string> = {};
    let resolved = false;

    const req = client.request(
      targetUrl,
      {
        method: 'GET',
        headers: reqHeaders,
        timeout: timeoutMs
      },
      (res: http.IncomingMessage) => {
        for (const [k, v] of Object.entries(res.headers)) {
          if (Array.isArray(v)) {
            receivedHeaders[k] = v.join(', ');
          } else if (v !== undefined) {
            receivedHeaders[k] = v;
          }
        }

        res.on('data', (chunk: any) => {
          const text = chunk.toString('utf-8');
          const newEvents = parser.feed(text);
          for (const ev of newEvents) {
            collectedEvents.push(ev);
            if (collectedEvents.length >= maxEvents && !resolved) {
              resolved = true;
              res.destroy();
              finish();
              return;
            }
          }
        });

        res.on('end', () => {
          if (!resolved) {
            resolved = true;
            finish();
          }
        });

        res.on('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            finish();
          }
        });
      }
    );

    req.on('error', (err: any) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Failed to connect to ${targetUrl}: ${err.message}`));
      }
    });

    req.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        req.destroy();
        finish();
      }
    });

    req.end();

    function finish() {
      const endTimeMs = Date.now();
      const metrics = calculateStreamMetrics(collectedEvents, startTimeMs, endTimeMs);
      const audit = lintEventStream(receivedHeaders, collectedEvents, metrics, targetUrl);
      resolve(audit);
    }
  });
}
