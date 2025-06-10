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

const args = process.argv.slice(2);
if (args.length == 0) {
  startRepl();
} else {
  const s = args.join(" ");
  console.log(calc(s));
}
