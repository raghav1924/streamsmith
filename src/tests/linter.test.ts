import { test } from 'node:test';
import assert from 'node:assert';
import { lintEventStream, calculateGrade } from '../core/linter.js';
import { SSEEvent, StreamMetrics } from '../types.js';

test('calculateGrade assigns expected grades correctly', () => {
  assert.strictEqual(calculateGrade(98), 'A+');
  assert.strictEqual(calculateGrade(87), 'A');
  assert.strictEqual(calculateGrade(72), 'B');
  assert.strictEqual(calculateGrade(58), 'C');
  assert.strictEqual(calculateGrade(42), 'D');
  assert.strictEqual(calculateGrade(25), 'F');
});

test('lintEventStream flags SSE-001 (Missing text/event-stream) as CRITICAL', () => {
  const headers = { 'content-type': 'application/json' };
  const metrics: StreamMetrics = {
    ttftMs: 50,
    totalDurationMs: 100,
    totalBytes: 50,
    eventCount: 2,
    tokensPerSecond: 20,
    meanInterChunkJitterMs: 10,
    maxInterChunkJitterMs: 15,
    bufferBurstinessIndex: 0,
    isProxyBuffered: false
  };

  const audit = lintEventStream(headers, [], metrics);
  assert.strictEqual(audit.isW3CCompliant, false);
  const sse001 = audit.issues.find(i => i.code === 'SSE-001');
  assert.ok(sse001, 'Should flag SSE-001');
  assert.strictEqual(sse001?.severity, 'CRITICAL');
});

test('lintEventStream flags SSE-002 (Missing X-Accel-Buffering) as CRITICAL', () => {
  const headers = { 'content-type': 'text/event-stream' };
  const metrics: StreamMetrics = {
    ttftMs: 50,
    totalDurationMs: 100,
    totalBytes: 50,
    eventCount: 2,
    tokensPerSecond: 20,
    meanInterChunkJitterMs: 10,
    maxInterChunkJitterMs: 15,
    bufferBurstinessIndex: 0,
    isProxyBuffered: false
  };

  const audit = lintEventStream(headers, [], metrics);
  const sse002 = audit.issues.find(i => i.code === 'SSE-002');
  assert.ok(sse002, 'Should flag SSE-002');
  assert.strictEqual(sse002?.severity, 'CRITICAL');
});

test('lintEventStream awards A+ on compliant streaming headers and metrics', () => {
  const headers = {
    'content-type': 'text/event-stream; charset=utf-8',
    'x-accel-buffering': 'no',
    'cache-control': 'no-cache, no-transform',
    'connection': 'keep-alive',
    'access-control-allow-origin': '*'
  };

  const events: SSEEvent[] = [
    { id: '1', data: 'hello', raw: 'id: 1\ndata: hello\n\n', timestampMs: 100, deltaMs: 20, chunkSizeBytes: 20, retry: 3000 },
    { id: '2', data: '[DONE]', raw: 'id: 2\ndata: [DONE]\n\n', timestampMs: 140, deltaMs: 40, chunkSizeBytes: 18 }
  ];

  const metrics: StreamMetrics = {
    ttftMs: 40,
    totalDurationMs: 200,
    totalBytes: 38,
    eventCount: 2,
    tokensPerSecond: 10,
    meanInterChunkJitterMs: 40,
    maxInterChunkJitterMs: 40,
    bufferBurstinessIndex: 0.1,
    isProxyBuffered: false
  };

  const audit = lintEventStream(headers, events, metrics);
  assert.strictEqual(audit.isW3CCompliant, true);
  assert.ok(audit.score >= 90);
});
