#!/usr/bin/env node
/**
 * StreamSmith Command Line Interface (CLI)
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import { inspectLiveStream } from './simulator/streamClient.js';
import { startMockStreamServer } from './simulator/mockServer.js';
import { generateServerConfig } from './generators/serverGen.js';
import { startStudioServer } from './studio/server.js';
import { FrameworkType } from './types.js';

const VERSION = '1.0.0';

export async function run(args: string[]): Promise<void> {
  const command = args[0] || 'help';

  if (command === '--version' || command === '-v') {
    console.log(`streamsmith v${VERSION} by Jatin Sharma (https://jatinsh.netlify.app/)`);
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'inspect':
    case 'audit':
      await handleInspect(args.slice(1));
      break;
    case 'mock':
      handleMock(args.slice(1));
      break;
    case 'generate':
      handleGenerate(args.slice(1));
      break;
    case 'studio':
      handleStudio(args.slice(1));
      break;
    default:
      console.error(`Unknown command: "${command}". Run "streamsmith help" for usage.`);
      process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
🌊 StreamSmith v${VERSION} — Developer-First SSE & LLM Stream Inspector
Author: Jatin Sharma (https://jatinsh.netlify.app/)

Usage:
  streamsmith <command> [options]

Commands:
  inspect <url>         Inspect live Server-Sent Events / LLM stream with timing analysis
  audit <url>           Audit stream against 14+ W3C SSE heuristics and proxy buffering
  mock                  Start zero-token mock LLM streaming server (Port 8088)
  generate              Generate production-hardened streaming server (Next.js, Express...)
  studio                Launch embedded Bento Grid Web Studio (Default port: 6666)
  help                  Show this help menu

Options:
  --port <port>         Port number for Mock (8088) or Studio (6666)
  --dialect <dialect>   Mock dialect: openai (default), anthropic, gemini, raw
  --speed <tps>         Tokens per second rate for mock (default: 40)
  --events <n>          Maximum events to sample during inspection (default: 30)
  --ci                  Exit with code 1 if audit score < 70 or critical issue found
  --json                Output audit or inspection results as JSON

Examples:
  streamsmith mock --port 8088 --dialect openai --speed 50
  streamsmith inspect http://localhost:8088/stream
  streamsmith audit https://api.openai.com/v1/chat/completions --ci
  streamsmith generate --framework nextjs
  streamsmith studio --port 6666
`);
}

async function handleInspect(args: string[]): Promise<void> {
  const target = args.find((a) => !a.startsWith('-')) || 'http://localhost:8088/stream';
  const isCi = args.includes('--ci');
  const isJson = args.includes('--json');
  const eventsIdx = args.indexOf('--events');
  const maxEvents = eventsIdx !== -1 ? parseInt(args[eventsIdx + 1], 10) : 30;

  console.log(`\n🌊 Inspecting SSE stream: ${target}...`);

  try {
    const result = await inspectLiveStream(target, { maxEvents });

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTerminalAudit(result);
    }

    if (isCi) {
      const hasCritical = result.issues.some((i) => i.severity === 'CRITICAL');
      if (result.score < 70 || hasCritical) {
        console.error(`\n✖ CI Check Failed: Stream audit score ${result.score}/100 below threshold.`);
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`\n✖ Stream Connection Failed: ${err.message}`);
    process.exit(1);
  }
}

function printTerminalAudit(r: any): void {
  const gradeColor = r.score >= 85 ? '\x1b[32m' : r.score >= 70 ? '\x1b[33m' : '\x1b[31m';
  console.log(`\n======================================================`);
  console.log(`🌊 StreamSmith SSE & LLM Stream Audit: ${r.url}`);
  console.log(`======================================================`);
  console.log(`Protocol Score: ${gradeColor}${r.score}/100 (Grade: ${r.grade})\x1b[0m`);
  console.log(`W3C Compliant: ${r.isW3CCompliant ? 'YES' : 'NO'}`);
  console.log(`Time to First Token (TTFT): ${Math.round(r.metrics.ttftMs)}ms`);
  console.log(`Streaming Rate: ${r.metrics.tokensPerSecond} tokens/sec`);
  console.log(`Mean Inter-Chunk Jitter: ${r.metrics.meanInterChunkJitterMs}ms`);
  console.log(`Buffer Burstiness Index: ${r.metrics.bufferBurstinessIndex} (0=Smooth, 1=Burst Dump)`);
  console.log(`Proxy Buffering Status: ${r.proxyBufferingVerdict.buffered ? '\x1b[31mBUFFERED DETECTED\x1b[0m' : '\x1b[32mSMOOTH STREAMING\x1b[0m'}`);

  console.log(`\n--- Protocol Findings (${r.issues.length}) ---`);
  if (r.issues.length === 0) {
    console.log(`\x1b[32m✔ Perfect stream configuration. Zero protocol or buffering defects!\x1b[0m`);
  } else {
    for (const iss of r.issues) {
      const col = iss.severity === 'CRITICAL' ? '\x1b[31m' : iss.severity === 'HIGH' ? '\x1b[35m' : '\x1b[33m';
      console.log(`\n${col}[${iss.severity}] ${iss.code}: ${iss.title}\x1b[0m`);
      console.log(`  Description: ${iss.description}`);
      console.log(`  Fix: \x1b[36m${iss.remediation}\x1b[0m`);
    }
  }
  console.log(`\n======================================================\n`);
}

function handleMock(args: string[]): void {
  const portIdx = args.indexOf('--port');
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 8088;
  const dialectIdx = args.indexOf('--dialect');
  const dialect = dialectIdx !== -1 ? (args[dialectIdx + 1] as any) : 'openai';
  const speedIdx = args.indexOf('--speed');
  const tokensPerSecond = speedIdx !== -1 ? parseInt(args[speedIdx + 1], 10) : 40;

  startMockStreamServer(port, { dialect, tokensPerSecond });
}

function handleGenerate(args: string[]): void {
  const fwIdx = args.indexOf('--framework');
  const fw = (fwIdx !== -1 ? args[fwIdx + 1] : 'nextjs') as FrameworkType;
  const config = generateServerConfig(fw);

  console.log(`\n// ${config.title} (${config.filename})`);
  console.log(`// ${config.description}\n`);
  console.log(config.code);
}

function handleStudio(args: string[]): void {
  const portIdx = args.indexOf('--port');
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 6666;
  startStudioServer(port);
}

if (process.argv[1] && (process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('streamsmith'))) {
  run(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
