#!/usr/bin/env node
import readline from "readline";
import { calc } from "./parser.js";
import { createStandardConfig } from "./configSetup.js";

const config = createStandardConfig();

export function startRepl(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "> ",
  });

  console.log("Token Value Calculator REPL");
  console.log("Type expressions like '2px + 2rem' or 'ctrl+c' to exit");

  rl.on("line", function (line) {
    try {
      const result = calc(line, config);
      console.log(result);
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

if (require.main === module) {
  startRepl();
}
