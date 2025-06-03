import { describe, it, expect } from "vitest";
import { calc } from "./parser.js";

describe("Basic arithmetic", () => {
  it("handles basic operations with correct precedence", () => {
    expect(calc("1 + 2 * 3")).toEqual([7]);
    expect(calc("(1 + 2) * 3")).toEqual([9]);
    expect(calc("1")).toEqual([1]);
    expect(calc("((1))")).toEqual([1]);
  });

  it("handles exponentiation correctly", () => {
    expect(calc("3^4^.5")).toEqual([9]);
    expect(calc("(2^3)^4")).toEqual([4096]);
  });

  it("handles negation correctly", () => {
    expect(calc("-2*-2")).toEqual([4]);
    expect(calc("-2*2")).toEqual([-4]);
    expect(calc("5- -3")).toEqual([8]);
  });

  it("handles division correctly", () => {
    expect(calc("5/2/.5")).toEqual([5]);
  });

  it("handles subtraction correctly", () => {
    expect(calc("5 - 3 - 1 - 4")).toEqual([-3]);
  });

  it("handles functions correctly", () => {
    expect(calc("floor(ceil(0.5) / 2)")).toEqual([0]);
    expect(calc("PI")).toEqual([Math.PI]);
    expect(calc("abs(cos(PI)) + 9")).toEqual([10]);
  });

  it("handles complex operations with correct precedence", () => {
    expect(calc("(15 + 20 - 17 * 8 / 3) * 7px")).toEqual([
      "-72.33333333333334px",
    ]);
  });
});

describe("Parser validation", () => {
  it("handles multiple expressions", () => {
    expect(calc("1 2")).toEqual([1, 2]);
    expect(calc("1 2 + 3")).toEqual([1, 5]);
    expect(calc("1 + 2 3")).toEqual([3, 3]);
    expect(calc("1+1 2+2")).toEqual([2, 4]);
    expect(calc("1+1 -2")).toEqual([2, -2]);
    expect(calc("1+1 - -2")).toEqual([4]);
  });

  it("throws on consecutive operators", () => {
    expect(() => calc("1 ++ 2")).toThrow();
    expect(() => calc("1 +* 2")).toThrow();
    expect(() => calc("1 */ 2")).toThrow();
    expect(() => calc("1 -- 2")).toThrow();
    expect(() => calc("1+++++++1")).toThrow();
    expect(() => calc("2**3")).toThrow();
  });

  it("handles valid negation", () => {
    expect(calc("1 + -2")).toEqual([-1]);
    expect(calc("2 * -3")).toEqual([-6]);
    expect(calc("6 / -2")).toEqual([-3]);
    expect(calc("2 ^ -2")).toEqual([0.25]);
  });

  it("handles complex expressions with negation", () => {
    expect(calc("1 + 2 * -3 + 4")).toEqual([-1]);
    expect(calc("-1 + 2 * -3")).toEqual([-7]);
    expect(calc("-(1 + 2)")).toEqual([-3]);
    expect(calc("(-1 + -2) * 3")).toEqual([-9]);
  });
});

describe("Parentheses validation", () => {
  it("throws on unmatched parentheses", () => {
    expect(() => calc("1 + 1)")).toThrow(/Unmatched closing parenthesis/);
    expect(() => calc("(1 + 1")).toThrow(/Unmatched opening parenthesis/);
    expect(() => calc("((1 + 2) + 3")).toThrow(/Unmatched opening parenthesis/);
  });
});

describe("CSS unit calculations", () => {
  it("handles addition with same units", () => {
    expect(calc("1px + 2px")).toEqual(["3px"]);
    expect(calc("1rem + 2rem")).toEqual(["3rem"]);
  });

  it("handles subtraction with same units", () => {
    expect(calc("5px - 2px")).toEqual(["3px"]);
  });

  it("handles multiplication with unitless", () => {
    expect(calc("2px * 3")).toEqual(["6px"]);
    expect(calc("2 * 3px")).toEqual(["6px"]);
  });

  it("handles division with unitless", () => {
    expect(calc("6px / 2")).toEqual(["3px"]);
  });

  it("handles division with same units", () => {
    expect(calc("6px / 2px")).toEqual(["3"]);
  });

  it("throws on operations with incompatible units", () => {
    expect(() => calc("1px + 1rem")).toThrow();
    expect(() => calc("1px * 1rem")).toThrow();
    expect(() => calc("1px / 1rem")).toThrow();
  });
});

describe("Multi-value expressions", () => {
  it("Multiple expressions return array of values", () => {
    expect(calc("1+1 2em * 3")).toEqual([2, "6em"]);
    expect(calc("1+1 2em * 3 + 1em 2px")).toEqual([2, "7em", "2px"]);
  });

  it("calc always returns array", () => {
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
});
