#!/usr/bin/env node
/**
 * StreamSmith CLI Entrypoint
 * Author: Jatin Sharma (https://jatinsh.netlify.app/)
 */
import("../dist/cli.js").then((cli) => {
  cli.run(process.argv.slice(2));
}).catch((err) => {
  console.error("Failed to start StreamSmith:", err);
  process.exit(1);
});
