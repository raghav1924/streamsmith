/**
 * StreamSmith Type Definitions
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */

export type AuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AuditGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
  comment?: string;
  raw: string;
  timestampMs: number;
  deltaMs: number;
  chunkSizeBytes: number;
}

export interface StreamMetrics {
  ttftMs: number;
  totalDurationMs: number;
  totalBytes: number;
  eventCount: number;
  tokensPerSecond: number;
  meanInterChunkJitterMs: number;
  maxInterChunkJitterMs: number;
  bufferBurstinessIndex: number; // 0 (perfect pacing) to 1 (all dumped in one burst)
  isProxyBuffered: boolean;
}

export interface AuditIssue {
  code: string;
  title: string;
  severity: AuditSeverity;
  description: string;
  remediation: string;
}

export interface StreamAuditResult {
  url: string;
  timestamp: string;
  score: number;
  grade: AuditGrade;
  headers: Record<string, string>;
  issues: AuditIssue[];
  metrics: StreamMetrics;
  eventsSample: SSEEvent[];
  isW3CCompliant: boolean;
  proxyBufferingVerdict: {
    buffered: boolean;
    confidencePercent: number;
    explanation: string;
  };
}

export type StreamDialect = 'openai' | 'anthropic' | 'gemini' | 'raw';

export interface MockStreamOptions {
  dialect?: StreamDialect;
  tokensPerSecond?: number;
  chunkJitterMs?: number;
  promptTopic?: string;
  totalTokens?: number;
  simulateDisconnectionAfter?: number;
  includeHeartbeats?: boolean;
  heartbeatIntervalMs?: number;
}

export type FrameworkType = 'nextjs' | 'express' | 'fastify' | 'cloudflare_workers' | 'hono' | 'fastapi';

export interface GeneratedServerConfig {
  framework: FrameworkType;
  title: string;
  filename: string;
  code: string;
  description: string;
}
