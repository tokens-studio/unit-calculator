#!/usr/bin/env node
// Use dynamic imports to handle both ts-node and compiled js environments
const importModule = async (path) => {
  try {
    // First try with .ts extension (for ts-node)
    return await import(path + '.ts');
  } catch (e) {
    // Fall back to .js extension (for compiled code)
    return await import(path + '.js');
  }
};

const { calc } = await importModule('./parser');
const { startRepl } = await importModule('./repl');
const { createStandardConfig } = await importModule('./configSetup');

const config = createStandardConfig();

const args = process.argv.slice(2);
if (args.length == 0) {
  startRepl();
} else {
  const s = args.join(" ");
  console.log(calc(s, config));
}
