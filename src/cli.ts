#!/usr/bin/env node
import { calc } from "./parser";
import { startRepl } from "./repl";
import { createStandardConfig } from "./configSetup";

const config = createStandardConfig();

const args = process.argv.slice(2);
if (args.length == 0) {
  startRepl();
} else {
  const s = args.join(" ");
  console.log(calc(s, config));
}
