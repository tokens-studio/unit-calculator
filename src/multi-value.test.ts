import { calc } from "./index.js";
import { expect, describe, it } from "vitest";

describe.skip("Multi-value expressions", () => {
  it("Single expression returns single value", () => {
    expect(calc("1+1")).toBe(2);
    expect(calc("2em * 3")).toBe("6em");
  });

  it("Multiple expressions return array of values", () => {
    expect(calc("1+1 2em * 3")).toEqual([2, "6em"]);
    expect(calc("1+1 2em * 3 + 1em -2px")).toEqual([2, "7em", "-2px"]);
  });

  it("calcMulti always returns array", () => {
    expect(calc("1+1")).toEqual([2]);
    expect(calc("1+1 2em * 3")).toEqual([2, "6em"]);
  });

  it("Handles expressions with parentheses", () => {
    expect(calc("(1+2) (3*4)")).toEqual([3, 12]);
    expect(calc("(2em + 1em) (4px * 2)")).toEqual(["3em", "8px"]);
  });

  it("Ignores extra whitespace", () => {
    expect(calc("  1+1   2em * 3  ")).toEqual([2, "6em"]);
  });

  it("Handles empty input", () => {
    expect(calc("")).toBe(0);
    expect(calc("")).toEqual([0]);
  });
});
