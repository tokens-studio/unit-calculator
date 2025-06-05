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
  console.log(
    "Type expressions like '2px + 2rem' or '2km + 500m' or 'ctrl+c' to exit"
  );
  console.log(
    "Supported dimension units: km, m, cm, mm, kg, g, mg, h, min, s, ms"
  );

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

// Check if this file is being run directly
const isMainModule = () => {
  try {
    return import.meta.url.endsWith(process.argv[1].replace("file://", ""));
  } catch (e) {
    return false;
  }
};

if (isMainModule()) {
  startRepl();
}
