#!/usr/bin/env node
// Use dynamic imports to handle both ts-node and compiled js environments
const importModule = async (path: string) => {
  try {
    return await import(path + ".ts");
  } catch (e) {
    return await import(path + ".js");
  }
};

const { calc } = await importModule("../lib/parser");
const { startRepl } = await importModule("./repl");
const { createConfig, defaultConfig } = await importModule("../lib/config");

function parseArgs(args: string[]) {
  const options = {
    allowStrings: defaultConfig.allowStrings,
    allowMultipleExpressions: defaultConfig.allowMultipleExpressions,
    units: [...defaultConfig.allowedUnits],
    expression: null as string | null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "--no-strings":
        options.allowStrings = false;
        break;
      case "--strings":
        options.allowStrings = true;
        break;
      case "--no-multiple-expressions":
        options.allowMultipleExpressions = false;
        break;
      case "--multiple-expressions":
        options.allowMultipleExpressions = true;
        break;
      case "--units":
        if (i + 1 < args.length) {
          options.units = args[i + 1].split(",");
          i++; // Skip next arg since we consumed it
        } else {
          console.error("--units requires a comma-separated list of units");
          process.exit(1);
        }
        break;
      case "--help":
      case "-h":
        console.log(`
Token Value Calculator CLI

Usage:
  npm run cli                           Start interactive REPL
  npm run cli "expression"              Evaluate expression
  npm run cli [options] "expression"    Evaluate with options

Options:
  --strings                    Allow strings in expressions (default)
  --no-strings                 Disallow strings in expressions
  --multiple-expressions       Allow multiple expressions (default)
  --no-multiple-expressions    Allow only single expressions
  --units <list>               Comma-separated list of allowed units
                              (default: ${defaultConfig.allowedUnits.size > 10 ? 'CSS units' : [...defaultConfig.allowedUnits].join(',')})
  --help, -h                   Show this help message

Examples:
  npm run cli "1px + 2px"
  npm run cli --no-strings "1 + 2"
  npm run cli --units "px,em,rem" "1px + 2em"
  npm run cli --no-multiple-expressions "1 + 1 2 + 2"
        `);
        process.exit(0);
        break;
      default:
        // If it doesn't start with --, treat it as the expression
        if (!arg.startsWith("--")) {
          options.expression = args.slice(i).join(" ");
          break;
        } else {
          console.error(`Unknown option: ${arg}`);
          console.error("Use --help for usage information");
          process.exit(1);
        }
    }
  }

  return options;
}

const args = process.argv.slice(2);
const options = parseArgs(args);

if (options.expression) {
  // Evaluate expression with options
  const config = createConfig({
    allowStrings: options.allowStrings,
    allowMultipleExpressions: options.allowMultipleExpressions,
    allowedUnits: new Set(options.units),
  });
  
  try {
    const result = calc(options.expression, config);
    console.log(result);
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(String(e));
    }
    process.exit(1);
  }
} else {
  // Start REPL with options
  startRepl({
    allowStrings: options.allowStrings,
    allowMultipleExpressions: options.allowMultipleExpressions,
    units: options.units,
  });
}
