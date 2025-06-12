#!/usr/bin/env node
import readline from "readline";
import { calc } from "../lib/parser.js";
import { defaultConfig, createConfig } from "../lib/config.js";
import type { CalcConfig } from "../lib/config.js";

interface ReplOptions {
  allowStrings?: boolean;
  allowMultipleExpressions?: boolean;
  units?: string[];
}

export function startRepl(options: ReplOptions = {}): void {
  // Create config with CLI options
  const config: CalcConfig = createConfig({
    ...defaultConfig,
    allowStrings: options.allowStrings ?? defaultConfig.allowStrings,
    allowMultipleExpressions:
      options.allowMultipleExpressions ??
      defaultConfig.allowMultipleExpressions,
    allowedUnits: options.units
      ? new Set(options.units)
      : defaultConfig.allowedUnits,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "> ",
  });

  console.log("Token Value Calculator REPL");
  console.log(
    `Supported dimension units: ${[...config.allowedUnits].join(", ")}`
  );
  console.log(`Strings allowed: ${config.allowStrings}`);
  console.log(
    `Multiple expressions allowed: ${config.allowMultipleExpressions}`
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
