/**
 * StreamSmith W3C EventSource Protocol Parser
 * Specification: https://html.spec.whatwg.org/multipage/server-sent-events.html
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import { SSEEvent } from '../types.js';

export interface ParseOptions {
  startTimeMs?: number;
}

export class EventStreamParser {
  private buffer: string = '';
  private lastEventTimeMs: number;
  private startTimeMs: number;

  constructor(options: ParseOptions = {}) {
    this.startTimeMs = options.startTimeMs || Date.now();
    this.lastEventTimeMs = this.startTimeMs;
  }

  /**
   * Feeds a network chunk of string data and extracts complete SSEEvent objects.
   */
  public feed(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const events: SSEEvent[] = [];

    // Normalize \r\n to \n
    let normalized = this.buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    let delimiterIndex: number;
    while ((delimiterIndex = normalized.indexOf('\n\n')) !== -1) {
      const rawEventBlock = normalized.substring(0, delimiterIndex);
      normalized = normalized.substring(delimiterIndex + 2);

      const parsed = this.parseEventBlock(rawEventBlock);
      if (parsed) {
        events.push(parsed);
      }
    }

    this.buffer = normalized;
    return events;
  }

  /**
   * Parses a single block delimited by double newlines into an SSEEvent.
   */
  public parseEventBlock(rawBlock: string): SSEEvent | null {
    if (!rawBlock.trim() && !rawBlock.startsWith(':')) {
      return null;
    }

    const now = Date.now();
    const deltaMs = now - this.lastEventTimeMs;
    this.lastEventTimeMs = now;

    const lines = rawBlock.split('\n');
    const dataLines: string[] = [];
    let eventType: string | undefined;
    let eventId: string | undefined;
    let retryMs: number | undefined;
    let comment: string | undefined;

    for (const line of lines) {
      if (line.startsWith(':')) {
        // Comment / Heartbeat
        comment = (comment ? comment + '\n' : '') + line.substring(1).trimStart();
        continue;
      }

      const colonIdx = line.indexOf(':');
      let field: string;
      let value: string;

      if (colonIdx === -1) {
        field = line.trim();
        value = '';
      } else {
        field = line.substring(0, colonIdx).trim();
        let val = line.substring(colonIdx + 1);
        // Strip a single leading space if present per spec
        if (val.startsWith(' ')) {
          val = val.substring(1);
        }
        value = val;
      }

      switch (field) {
        case 'data':
          dataLines.push(value);
          break;
        case 'event':
          eventType = value;
          break;
        case 'id':
          if (!value.includes('\u0000')) {
            eventId = value;
          }
          break;
        case 'retry':
          const parsedRetry = parseInt(value, 10);
          if (!isNaN(parsedRetry)) {
            retryMs = parsedRetry;
          }
          break;
      }
    }

    // Spec: If no data lines and no comment, ignore event
    if (dataLines.length === 0 && !comment && !eventType) {
      return null;
    }

    return {
      id: eventId,
      event: eventType || 'message',
      data: dataLines.join('\n'),
      retry: retryMs,
      comment,
      raw: rawBlock,
      timestampMs: now,
      deltaMs,
      chunkSizeBytes: Buffer.byteLength(rawBlock, 'utf-8')
    };
  }

  /**
   * Resets the internal stream buffer.
   */
  public reset(): void {
    this.buffer = '';
    this.lastEventTimeMs = Date.now();
  }
}
