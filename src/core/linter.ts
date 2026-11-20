/**
 * StreamSmith 14+ SSE & LLM Streaming Heuristics Engine
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import { AuditIssue, AuditGrade, StreamMetrics, StreamAuditResult, SSEEvent } from '../types.js';

export function calculateGrade(score: number): AuditGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function lintEventStream(
  headers: Record<string, string>,
  events: SSEEvent[],
  metrics: StreamMetrics,
  targetUrl: string = 'http://localhost:8080/stream'
): StreamAuditResult {
  const issues: AuditIssue[] = [];
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    h[k.toLowerCase()] = v;
  }

  const contentType = h['content-type']?.toLowerCase() || '';
  const cacheControl = h['cache-control']?.toLowerCase() || '';
  const connection = h['connection']?.toLowerCase() || '';
  const accelBuffering = h['x-accel-buffering']?.toLowerCase();
  const allowOrigin = h['access-control-allow-origin'];
  const contentEncoding = h['content-encoding'];

  // 1. SSE-001 (CRITICAL): Content-Type: text/event-stream
  if (!contentType.includes('text/event-stream')) {
    issues.push({
      code: 'SSE-001',
      title: 'Missing Content-Type: text/event-stream',
      severity: 'CRITICAL',
      description: `Server returned Content-Type "${contentType || 'none'}". The W3C EventSource standard requires "text/event-stream". Browsers will reject the stream.`,
      remediation: 'Set response header "Content-Type: text/event-stream; charset=utf-8".'
    });
  }

  // 2. SSE-002 (CRITICAL): X-Accel-Buffering: no
  if (accelBuffering !== 'no') {
    issues.push({
      code: 'SSE-002',
      title: 'Missing X-Accel-Buffering: no (Proxy Buffering Risk)',
      description: 'Without "X-Accel-Buffering: no", reverse proxies like Nginx and OpenResty hold response chunks in 4KB/8KB buffers instead of flushing real-time tokens.',
      severity: 'CRITICAL',
      remediation: 'Emit "X-Accel-Buffering: no" on all SSE endpoints.'
    });
  }

  // 3. SSE-003 (HIGH): Cache-Control: no-cache
  if (!cacheControl.includes('no-cache')) {
    issues.push({
      code: 'SSE-003',
      title: 'Missing Cache-Control: no-cache, no-transform',
      description: `Cache-Control is "${cacheControl || 'none'}". Intermediate CDNs or browser caches may store or transform the streaming response.`,
      severity: 'HIGH',
      remediation: 'Configure "Cache-Control: no-cache, no-transform".'
    });
  }

  // 4. SSE-004 (HIGH): Proxy Buffering Detected via Burstiness Index
  if (metrics.isProxyBuffered) {
    issues.push({
      code: 'SSE-004',
      title: 'Live Proxy Buffering Detected (High Burstiness Index)',
      severity: 'HIGH',
      description: `High burstiness index (${metrics.bufferBurstinessIndex * 100}%). Events arrived clustered in rapid microsecond bursts after delay, indicating reverse proxy chunk buffering.`,
      remediation: 'Disable downstream proxy buffering (Nginx proxy_buffering off; Cloudflare buffer bypass).'
    });
  }

  // 5. SSE-005 (HIGH): Connection: keep-alive
  if (connection && !connection.includes('keep-alive')) {
    issues.push({
      code: 'SSE-005',
      title: 'Connection Header Not Set to keep-alive',
      severity: 'HIGH',
      description: `Connection is set to "${connection}". HTTP/1.1 streaming requires persistent keep-alive sockets.`,
      remediation: 'Set "Connection: keep-alive" header explicitly.'
    });
  }

  // 6. SSE-006 (MEDIUM): Missing Heartbeat / Ping Comments
  const hasHeartbeat = events.some(e => e.comment && (e.comment.includes('ping') || e.comment.includes('keepalive') || e.comment === ''));
  if (!hasHeartbeat && metrics.totalDurationMs > 15000) {
    issues.push({
      code: 'SSE-006',
      title: 'Missing Heartbeat Comments (: ping)',
      severity: 'MEDIUM',
      description: 'Stream exceeded 15 seconds without periodic keep-alive comments. Load balancers (AWS ALB, Cloudflare 100s) will terminate idle streaming connections.',
      remediation: 'Transmit periodic heartbeat comments (": ping\\n\\n") every 15-30 seconds.'
    });
  }

  // 7. SSE-007 (MEDIUM): Missing Event ID on Multi-Event Stream
  const hasEventIds = events.some(e => Boolean(e.id));
  if (!hasEventIds && events.length > 5) {
    issues.push({
      code: 'SSE-007',
      title: 'Missing "id:" Field for Resilient Stream Resumption',
      severity: 'MEDIUM',
      description: 'No event IDs emitted. If client connection drops mid-generation, it cannot supply Last-Event-ID to resume without data loss.',
      remediation: 'Include sequential or UUID "id: <id>" tags on data chunks.'
    });
  }

  // 8. SSE-008 (MEDIUM): High TTFT (Time-to-First-Token)
  if (metrics.ttftMs > 2500) {
    issues.push({
      code: 'SSE-008',
      title: `Excessive Time-to-First-Token (${metrics.ttftMs}ms)`,
      severity: 'MEDIUM',
      description: 'First stream event took over 2,500ms to arrive. Indicates slow prompt ingestion, missing response header flush, or backend queuing.',
      remediation: 'Call res.flushHeaders() immediately before initiating token generation.'
    });
  }

  // 9. SSE-009 (MEDIUM): Content-Encoding Compression Hazard
  if (contentEncoding && !contentEncoding.includes('identity')) {
    issues.push({
      code: 'SSE-009',
      title: `Active Compression (${contentEncoding}) Stalling Stream`,
      severity: 'MEDIUM',
      description: 'HTTP response is compressed with gzip/brotli. Many compression layers buffer chunks until window size fills up, breaking streaming.',
      remediation: 'Disable compression on streaming routes or ensure immediate zlib flushes.'
    });
  }

  // 10. SSE-010 (LOW): Missing Reconnect Retry Directive
  const hasRetry = events.some(e => e.retry !== undefined);
  if (!hasRetry) {
    issues.push({
      code: 'SSE-010',
      title: 'Unconfigured Reconnect Interval (retry: <ms>)',
      severity: 'LOW',
      description: 'Server did not declare a "retry: <ms>" directive. Browsers default to 3,000ms reconnect intervals.',
      remediation: 'Send "retry: 5000\\n\\n" on initial stream handshake to pace client reconnects.'
    });
  }

  // 11. SSE-011 (LOW): Missing CORS Header
  if (!allowOrigin) {
    issues.push({
      code: 'SSE-011',
      title: 'Missing Access-Control-Allow-Origin',
      severity: 'LOW',
      description: 'No CORS headers emitted. Cross-origin frontend web apps will be blocked by browser security.',
      remediation: 'Include "Access-Control-Allow-Origin: *" or client domain.'
    });
  }

  // 12. SSE-012 (INFO): Standard Termination Marker
  const hasDoneMarker = events.some(e => e.data === '[DONE]' || e.event === 'done' || e.event === 'finish');
  if (events.length > 0 && !hasDoneMarker) {
    issues.push({
      code: 'SSE-012',
      title: 'No Explicit Stream Termination Chunk (e.g. data: [DONE])',
      severity: 'INFO',
      description: 'Stream ended without explicit [DONE] signal. Client must rely on socket EOF rather than clean event lifecycle.',
      remediation: 'Transmit "data: [DONE]\\n\\n" upon stream completion.'
    });
  }

  // Score Calculation
  let penalty = 0;
  for (const iss of issues) {
    if (iss.severity === 'CRITICAL') penalty += 30;
    else if (iss.severity === 'HIGH') penalty += 18;
    else if (iss.severity === 'MEDIUM') penalty += 10;
    else if (iss.severity === 'LOW') penalty += 4;
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade = calculateGrade(score);
  const isW3CCompliant = !issues.some(i => i.severity === 'CRITICAL');

  return {
    url: targetUrl,
    timestamp: new Date().toISOString(),
    score,
    grade,
    headers,
    issues,
    metrics,
    eventsSample: events.slice(0, 20),
    isW3CCompliant,
    proxyBufferingVerdict: {
      buffered: metrics.isProxyBuffered,
      confidencePercent: metrics.isProxyBuffered ? Math.round(metrics.bufferBurstinessIndex * 100) : 95,
      explanation: metrics.isProxyBuffered
        ? 'High burstiness detected: downstream reverse proxy (Nginx/Cloudflare) is buffering chunks.'
        : 'Smooth streaming detected: chunks arrive with steady inter-arrival intervals.'
    }
  };
}
