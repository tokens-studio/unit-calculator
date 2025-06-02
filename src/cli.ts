#!/usr/bin/env node
import { calc } from "./parser.js";
import { startRepl } from "./repl.js";

const args = process.argv.slice(2);
if (args.length == 0) {
  startRepl();
} else {
  const s = args.join(" ");
  console.log(calc(s));
}
