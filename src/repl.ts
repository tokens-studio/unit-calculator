#!/usr/bin/env node
import { calc } from "./parser.js";
import readline from "readline";

export function startRepl(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "> ",
  });

  rl.on("line", function (line) {
    try {
      console.log(calc(line));
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(String(e));
      }
    }
    rl.prompt();
  });
  rl.prompt();
}

// Run the REPL if this file is executed directly
if (require.main === module) {
  startRepl();
}
