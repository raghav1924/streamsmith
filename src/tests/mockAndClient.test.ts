import { test } from 'node:test';
import assert from 'node:assert';
import { startMockStreamServer } from '../simulator/mockServer.js';
import { inspectLiveStream } from '../simulator/streamClient.js';

test('startMockStreamServer and inspectLiveStream perform live end-to-end streaming', async () => {
  const port = 8995;
  const mockServer = startMockStreamServer(port, {
    dialect: 'openai',
    tokensPerSecond: 100
  });

  await new Promise<void>((resolve) => setTimeout(resolve, 150));

  try {
    const audit = await inspectLiveStream(`http://localhost:${port}/stream`, { maxEvents: 6, timeoutMs: 5000 });
    assert.strictEqual(audit.isW3CCompliant, true);
    assert.ok(audit.eventsSample.length >= 5);
    assert.ok(audit.metrics.ttftMs < 1000);
    assert.strictEqual(audit.proxyBufferingVerdict.buffered, false);

    // Verify first event has OpenAI structure
    const firstData = audit.eventsSample[0].data;
    assert.ok(firstData.includes('chat.completion.chunk') || firstData.includes('Building'));
  } finally {
    mockServer.close();
  }
});
