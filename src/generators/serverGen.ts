/**
 * StreamSmith Multi-Framework Streaming Server Generator
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import { GeneratedServerConfig, FrameworkType } from '../types.js';

export function generateServerConfig(framework: FrameworkType): GeneratedServerConfig {
  switch (framework) {
    case 'nextjs':
      return {
        framework: 'nextjs',
        title: 'Next.js 14/15 App Router Edge SSE Handler',
        filename: 'app/api/stream/route.ts',
        description: 'Production-ready streaming route with Web Streams API, anti-buffering headers, and client abort signal handling.',
        code: `import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Deploy on Edge for minimal TTFT

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      // 1. Initial retry interval configuration
      controller.enqueue(encoder.encode('retry: 3000\\n\\n'));

      // 2. Stream chunks
      const tokens = ['Hello', 'from', 'Next.js', 'App', 'Router', 'SSE', 'Stream!'];
      for (const token of tokens) {
        if (req.signal.aborted) break;
        const payload = JSON.stringify({ text: token });
        controller.enqueue(encoder.encode(\`data: \${payload}\\n\\n\`));
        await new Promise(r => setTimeout(r, 40));
      }

      // 3. Clean termination chunk
      controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
      controller.close();
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Critical: disables Nginx/proxy buffering
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`
      };

    case 'express':
      return {
        framework: 'express',
        title: 'Express.js Resilient SSE Route',
        filename: 'src/routes/stream.ts',
        description: 'Express streaming route with immediate flushHeaders(), heartbeat timer, and client disconnect cleanup.',
        code: `import { Request, Response } from 'express';

export function handleSseStream(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Flush headers immediately so client starts receiving TTFT < 50ms
  res.flushHeaders();

  // 15s Heartbeat to prevent ALB / Cloudflare idle disconnects
  const heartbeat = setInterval(() => {
    res.write(': ping\\n\\n');
  }, 15000);

  let counter = 0;
  const timer = setInterval(() => {
    counter++;
    res.write(\`id: \${counter}\\nevent: message\\ndata: \${JSON.stringify({ count: counter })}\\n\\n\`);

    if (counter >= 20) {
      clearInterval(timer);
      clearInterval(heartbeat);
      res.write('data: [DONE]\\n\\n');
      res.end();
    }
  }, 50);

  req.on('close', () => {
    clearInterval(timer);
    clearInterval(heartbeat);
  });
}
`
      };

    case 'fastify':
      return {
        framework: 'fastify',
        title: 'Fastify High-Throughput SSE Route',
        filename: 'src/plugins/sse.ts',
        description: 'Fastify raw socket stream handler with zero buffering and low-overhead chunk writing.',
        code: `import { FastifyPluginAsync } from 'fastify';

export const ssePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    let index = 0;
    const interval = setInterval(() => {
      index++;
      reply.raw.write(\`id: \${index}\\ndata: Token \${index}\\n\\n\`);
      if (index >= 30) {
        clearInterval(interval);
        reply.raw.write('data: [DONE]\\n\\n');
        reply.raw.end();
      }
    }, 30);

    request.raw.on('close', () => clearInterval(interval));
  });
};
`
      };

    case 'cloudflare_workers':
      return {
        framework: 'cloudflare_workers',
        title: 'Cloudflare Workers TransformStream SSE',
        filename: 'src/worker.ts',
        description: 'Edge worker streaming with TransformStream and zero buffering.',
        code: `export default {
  async fetch(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      await writer.write(encoder.encode('retry: 2000\\n\\n'));
      for (let i = 1; i <= 20; i++) {
        await writer.write(encoder.encode(\`id: \${i}\\ndata: {"chunk": \${i}}\\n\\n\`));
        await new Promise(r => setTimeout(r, 50));
      }
      await writer.write(encoder.encode('data: [DONE]\\n\\n'));
      await writer.close();
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
`
      };

    case 'hono':
      return {
        framework: 'hono',
        title: 'Hono Multi-Runtime streamSSE() Handler',
        filename: 'src/index.ts',
        description: 'Hono helper streamSSE() with typed event dispatch and automatic keep-alive.',
        code: `import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

const app = new Hono();

app.get('/stream', (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: JSON.stringify({ message: 'Stream started' }),
      event: 'start',
      id: String(1)
    });

    for (let i = 0; i < 15; i++) {
      await stream.writeSSE({
        data: \`Token chunk \${i}\`,
        id: String(i + 2)
      });
      await stream.sleep(40);
    }

    await stream.writeSSE({ data: '[DONE]' });
  });
});

export default app;
`
      };

    case 'fastapi':
      return {
        framework: 'fastapi',
        title: 'FastAPI (Python) Async Event Generator',
        filename: 'main.py',
        description: 'Python FastAPI async generator with StreamingResponse and X-Accel-Buffering disable.',
        code: `import asyncio
import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def event_generator():
    yield "retry: 3000\\n\\n"
    for i in range(1, 21):
        payload = json.dumps({"token_id": i, "content": f"Word_{i} "})
        yield f"id: {i}\\ndata: {payload}\\n\\n"
        await asyncio.sleep(0.04)
    yield "data: [DONE]\\n\\n"

@app.get("/stream")
async def stream():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )
`
      };
  }
}
