#!/usr/bin/env node
import { calc } from "./parser.ts";
import { startRepl } from "./repl.ts";
import { createStandardConfig } from "./configSetup.ts";

const config = createStandardConfig();

const args = process.argv.slice(2);
if (args.length == 0) {
  startRepl();
} else {
  const s = args.join(" ");
  console.log(calc(s, config));
}
