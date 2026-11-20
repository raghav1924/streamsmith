/**
 * StreamSmith Streaming Metrics, Jitter & Proxy Buffering Engine
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import { SSEEvent, StreamMetrics } from '../types.js';

export function calculateStreamMetrics(
  events: SSEEvent[],
  startTimeMs: number,
  endTimeMs: number
): StreamMetrics {
  const totalDurationMs = Math.max(1, endTimeMs - startTimeMs);
  const eventCount = events.length;

  let totalBytes = 0;
  for (const ev of events) {
    totalBytes += ev.chunkSizeBytes;
  }

  if (eventCount === 0) {
    return {
      ttftMs: totalDurationMs,
      totalDurationMs,
      totalBytes,
      eventCount: 0,
      tokensPerSecond: 0,
      meanInterChunkJitterMs: 0,
      maxInterChunkJitterMs: 0,
      bufferBurstinessIndex: 0,
      isProxyBuffered: false
    };
  }

  // TTFT: duration until the first complete event
  const ttftMs = Math.max(0, events[0].timestampMs - startTimeMs);

  // Inter-chunk deltas (ignoring first event)
  const deltas: number[] = [];
  for (let i = 1; i < events.length; i++) {
    deltas.push(events[i].deltaMs);
  }

  let meanJitter = 0;
  let maxJitter = 0;
  if (deltas.length > 0) {
    const sum = deltas.reduce((acc, v) => acc + v, 0);
    meanJitter = Math.round((sum / deltas.length) * 10) / 10;
    maxJitter = Math.max(...deltas);
  }

  // Calculate Tokens per second
  const durationSec = totalDurationMs / 1000;
  const tokensPerSecond = Math.round((eventCount / durationSec) * 10) / 10;

  // Proxy Buffering Heuristic:
  // If >75% of events arrived in rapid succession (< 8ms apart) while overall duration was long,
  // or if TTFT accounted for >80% of total duration with all events following in a dump, it's buffered.
  let burstCount = 0;
  for (const d of deltas) {
    if (d <= 8) {
      burstCount++;
    }
  }

  const burstRatio = deltas.length > 0 ? burstCount / deltas.length : 0;
  const bufferBurstinessIndex = Math.round(burstRatio * 100) / 100;

  // Verdict: Buffered if burstRatio > 0.70 and eventCount >= 5
  const isProxyBuffered = eventCount >= 5 && burstRatio > 0.70;

  return {
    ttftMs,
    totalDurationMs,
    totalBytes,
    eventCount,
    tokensPerSecond,
    meanInterChunkJitterMs: meanJitter,
    maxInterChunkJitterMs: maxJitter,
    bufferBurstinessIndex,
    isProxyBuffered
  };
}
