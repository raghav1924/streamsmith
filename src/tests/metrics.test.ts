import { test } from 'node:test';
import assert from 'node:assert';
import { calculateStreamMetrics } from '../core/metrics.js';
import { SSEEvent } from '../types.js';

test('calculateStreamMetrics handles empty stream safely', () => {
  const metrics = calculateStreamMetrics([], 1000, 2000);
  assert.strictEqual(metrics.eventCount, 0);
  assert.strictEqual(metrics.isProxyBuffered, false);
});

test('calculateStreamMetrics accurately computes TTFT and tokens per second', () => {
  const events: SSEEvent[] = [
    { data: 'one', raw: 'data: one\n\n', timestampMs: 1100, deltaMs: 100, chunkSizeBytes: 11 },
    { data: 'two', raw: 'data: two\n\n', timestampMs: 1200, deltaMs: 100, chunkSizeBytes: 11 },
    { data: 'three', raw: 'data: three\n\n', timestampMs: 1300, deltaMs: 100, chunkSizeBytes: 13 }
  ];

  const metrics = calculateStreamMetrics(events, 1000, 1500);
  assert.strictEqual(metrics.ttftMs, 100);
  assert.strictEqual(metrics.eventCount, 3);
  assert.strictEqual(metrics.totalBytes, 35);
  assert.strictEqual(metrics.isProxyBuffered, false);
});

test('calculateStreamMetrics detects proxy buffering when chunks burst in <8ms', () => {
  const events: SSEEvent[] = [
    { data: 't1', raw: 'data: t1\n\n', timestampMs: 2000, deltaMs: 1000, chunkSizeBytes: 10 },
    { data: 't2', raw: 'data: t2\n\n', timestampMs: 2002, deltaMs: 2, chunkSizeBytes: 10 },
    { data: 't3', raw: 'data: t3\n\n', timestampMs: 2004, deltaMs: 2, chunkSizeBytes: 10 },
    { data: 't4', raw: 'data: t4\n\n', timestampMs: 2006, deltaMs: 2, chunkSizeBytes: 10 },
    { data: 't5', raw: 'data: t5\n\n', timestampMs: 2008, deltaMs: 2, chunkSizeBytes: 10 },
    { data: 't6', raw: 'data: t6\n\n', timestampMs: 2010, deltaMs: 2, chunkSizeBytes: 10 }
  ];

  const metrics = calculateStreamMetrics(events, 1000, 2015);
  assert.strictEqual(metrics.eventCount, 6);
  assert.strictEqual(metrics.isProxyBuffered, true);
  assert.ok(metrics.bufferBurstinessIndex > 0.70);
});
