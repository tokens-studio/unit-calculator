#!/usr/bin/env node
import readline from "readline";
import { calc } from "./parser.js";
import {
  createConfig,
  defaultConversionsArray,
  arrayToConversionKey,
} from "./config.js";

const baseSize = 16;

const config = createConfig({
  allowedUnits: new Set(["px", "rem"]),
  unitConversions: [
    ...defaultConversionsArray,
    [
      ["px", "+", "rem"],
      (left, right) => ({
        value: left.value * (right.value * baseSize),
        unit: "px",
      }),
    ],
    [
      ["rem", "+", "px"],
      (left, right) => ({
        value: left.value * baseSize + right.value,
        unit: "px",
      }),
    ],
  ].map(([keyArray, fn]) => [arrayToConversionKey(keyArray), fn]),
});

export function startRepl(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "> ",
  });

  rl.on("line", function (line) {
    try {
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
