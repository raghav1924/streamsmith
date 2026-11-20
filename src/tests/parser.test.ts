import { test } from 'node:test';
import assert from 'node:assert';
import { EventStreamParser } from '../core/parser.js';

test('EventStreamParser parses simple message events', () => {
  const parser = new EventStreamParser();
  const raw = 'data: hello world\n\n';
  const events = parser.feed(raw);

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].data, 'hello world');
  assert.strictEqual(events[0].event, 'message');
});

test('EventStreamParser parses custom event, id, and retry directives', () => {
  const parser = new EventStreamParser();
  const raw = 'id: 42\nevent: custom_delta\nretry: 5000\ndata: payload data\n\n';
  const events = parser.feed(raw);

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].id, '42');
  assert.strictEqual(events[0].event, 'custom_delta');
  assert.strictEqual(events[0].retry, 5000);
  assert.strictEqual(events[0].data, 'payload data');
});

test('EventStreamParser handles multiline data fields joined with newlines', () => {
  const parser = new EventStreamParser();
  const raw = 'data: line one\ndata: line two\ndata: line three\n\n';
  const events = parser.feed(raw);

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].data, 'line one\nline two\nline three');
});

test('EventStreamParser ignores comments but records heartbeat', () => {
  const parser = new EventStreamParser();
  const raw = ': ping heartbeat\ndata: after ping\n\n';
  const events = parser.feed(raw);

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].comment, 'ping heartbeat');
  assert.strictEqual(events[0].data, 'after ping');
});

test('EventStreamParser handles fragmented network chunks across TCP boundaries', () => {
  const parser = new EventStreamParser();
  
  // Fragment 1: partial event
  const chunk1 = 'id: 101\nevent: tok';
  const evs1 = parser.feed(chunk1);
  assert.strictEqual(evs1.length, 0);

  // Fragment 2: complete event + partial second event
  const chunk2 = 'en\ndata: first chunk\n\nid: 102\ndata: se';
  const evs2 = parser.feed(chunk2);
  assert.strictEqual(evs2.length, 1);
  assert.strictEqual(evs2[0].id, '101');
  assert.strictEqual(evs2[0].event, 'token');
  assert.strictEqual(evs2[0].data, 'first chunk');

  // Fragment 3: complete second event
  const chunk3 = 'cond chunk\n\n';
  const evs3 = parser.feed(chunk3);
  assert.strictEqual(evs3.length, 1);
  assert.strictEqual(evs3[0].id, '102');
  assert.strictEqual(evs3[0].data, 'second chunk');
});
