#!/usr/bin/env node
import { calc } from "./parser.js";
import { startRepl } from "./repl.js";

// CLI functionality
const args = process.argv.slice(2);
if (args.length == 0) {
  // Start REPL if no arguments provided
  startRepl();
} else {
  // Calculate the expression from command line arguments
  const s = args.join(" ");
  console.log(calc(s));
}
