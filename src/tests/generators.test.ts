import { test } from 'node:test';
import assert from 'node:assert';
import { generateServerConfig } from '../generators/serverGen.js';

test('generateServerConfig produces valid Next.js App Router code', () => {
  const config = generateServerConfig('nextjs');
  assert.strictEqual(config.framework, 'nextjs');
  assert.ok(config.code.includes('ReadableStream'));
  assert.ok(config.code.includes('X-Accel-Buffering'));
  assert.ok(config.code.includes('text/event-stream'));
});

test('generateServerConfig produces valid Express code with flushHeaders', () => {
  const config = generateServerConfig('express');
  assert.strictEqual(config.framework, 'express');
  assert.ok(config.code.includes('res.flushHeaders()'));
  assert.ok(config.code.includes(': ping'));
});

test('generateServerConfig produces valid Fastify code', () => {
  const config = generateServerConfig('fastify');
  assert.strictEqual(config.framework, 'fastify');
  assert.ok(config.code.includes('reply.raw.writeHead'));
});

test('generateServerConfig produces valid Cloudflare Workers code', () => {
  const config = generateServerConfig('cloudflare_workers');
  assert.strictEqual(config.framework, 'cloudflare_workers');
  assert.ok(config.code.includes('TransformStream'));
});

test('generateServerConfig produces valid Hono and FastAPI code', () => {
  const hono = generateServerConfig('hono');
  assert.strictEqual(hono.framework, 'hono');
  assert.ok(hono.code.includes('streamSSE'));

  const fastapi = generateServerConfig('fastapi');
  assert.strictEqual(fastapi.framework, 'fastapi');
  assert.ok(fastapi.code.includes('StreamingResponse'));
});
