/**
 * Ambient Node.js and Browser Type Declarations
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */

declare namespace NodeJS {
  interface Process {
    argv: string[];
    version: string;
    cwd(): string;
    exit(code?: number): never;
    env: Record<string, string | undefined>;
    platform: string;
    stdout: {
      write(str: string): boolean;
    };
    stderr: {
      write(str: string): boolean;
    };
    on(event: string, listener: (...args: any[]) => void): this;
  }
  interface Timeout {}
  interface Immediate {}
}

declare const process: NodeJS.Process;
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  table(...args: any[]): void;
};

declare const Buffer: {
  from(str: string, encoding?: string): any;
  byteLength(string: string | any, encoding?: string): number;
};

declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare function clearInterval(intervalId: NodeJS.Timeout): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;
declare function clearImmediate(immediateId: NodeJS.Immediate): void;

declare module 'url' {
  export class URL {
    constructor(input: string, base?: string | URL);
    href: string;
    origin: string;
    protocol: string;
    username: string;
    password: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    searchParams: {
      get(name: string): string | null;
      set(name: string, value: string): void;
      has(name: string): boolean;
    };
    hash: string;
  }
}

declare module 'node:url' {
  export * from 'url';
}

declare module 'events' {
  export class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    pipe?<T>(dest: T): T;
  }
}

declare module 'node:events' {
  export * from 'events';
}

declare module 'http' {
  import { EventEmitter } from 'events';

  export interface IncomingHttpHeaders {
    [header: string]: string | string[] | undefined;
  }

  export interface IncomingMessage extends EventEmitter {
    url?: string;
    method?: string;
    statusCode?: number;
    statusMessage?: string;
    headers: IncomingHttpHeaders;
    on(event: 'data', listener: (chunk: any) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: any) => void): this;
    on(event: 'close', listener: () => void): this;
    pipe<T>(destination: T, options?: { end?: boolean }): T;
    resume(): this;
    destroy(err?: Error): void;
  }

  export interface ServerResponse extends EventEmitter {
    statusCode: number;
    writeHead(statusCode: number, headers?: Record<string, string | number | string[]>): this;
    setHeader(name: string, value: string | number | readonly string[]): this;
    write(chunk: any, encoding?: string, callback?: () => void): boolean;
    flushHeaders?(): void;
    end(data?: string | any): this;
    destroy(err?: Error): void;
    pipe?<T>(destination: T): T;
  }

  export interface ClientRequest extends EventEmitter {
    write(chunk: any, callback?: () => void): boolean;
    end(data?: any, callback?: () => void): void;
    abort(): void;
    destroy(err?: Error): void;
    setTimeout(msecs: number, callback?: () => void): this;
    pipe<T>(destination: T, options?: { end?: boolean }): T;
  }

  export interface Server extends EventEmitter {
    listen(port?: number, hostname?: string, callback?: () => void): this;
    listen(port?: number, callback?: () => void): this;
    close(callback?: (err?: Error) => void): this;
    address(): any;
  }

  export function createServer(requestListener?: (req: IncomingMessage, res: ServerResponse) => void): Server;
  export function request(url: string | any, options: any, callback?: (res: IncomingMessage) => void): ClientRequest;
  export function get(url: string | any, callback?: (res: IncomingMessage) => void): ClientRequest;
}

declare module 'node:http' {
  export * from 'http';
}

declare module 'https' {
  import { ClientRequest, IncomingMessage } from 'http';
  export function request(url: string | any, options: any, callback?: (res: IncomingMessage) => void): ClientRequest;
  export function get(url: string | any, callback?: (res: IncomingMessage) => void): ClientRequest;
}

declare module 'node:https' {
  export * from 'https';
}

declare module 'perf_hooks' {
  export const performance: {
    now(): number;
  };
}

declare module 'node:perf_hooks' {
  export * from 'perf_hooks';
}

declare module 'node:test' {
  export function test(name: string, fn: (t?: any) => void | Promise<void>): void;
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: (t?: any) => void | Promise<void>): void;
}

declare module 'node:assert' {
  export function strictEqual(actual: any, expected: any, message?: string | Error): void;
  export function notStrictEqual(actual: any, expected: any, message?: string | Error): void;
  export function deepStrictEqual(actual: any, expected: any, message?: string | Error): void;
  export function ok(value: any, message?: string | Error): void;
  export function match(value: string, regExp: RegExp, message?: string | Error): void;
}
