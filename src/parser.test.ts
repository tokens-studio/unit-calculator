import { describe, it, expect } from "vitest";
import { calc } from "./parser.js";

describe("Basic arithmetic", () => {
  it("handles basic operations with correct precedence", () => {
    expect(calc("1 + 2 * 3")).toBe(7);
    expect(calc("(1 + 2) * 3")).toBe(9);
    expect(calc("1")).toBe(1);
    expect(calc("((1))")).toBe(1);
  });

  it("handles exponentiation correctly", () => {
    expect(calc("3^4^.5")).toBe(9);
    expect(calc("(2^3)^4")).toBe(4096);
  });

  it("handles negation correctly", () => {
    expect(calc("-2*-2")).toBe(4);
    expect(calc("-2*2")).toBe(-4);
  });

  it("handles division correctly", () => {
    expect(calc("5/2/.5")).toBe(5);
  });

  it("handles subtraction correctly", () => {
    expect(calc("5 - 3 - 1 - 4")).toBe(-3);
  });

  it("handles functions correctly", () => {
    expect(calc("floor(ceil(0.5) / 2)")).toBe(0);
    expect(calc("PI")).toBe(Math.PI);
    expect(calc("abs(cos(PI)) + 9")).toBe(10);
  });
});

describe("Parser validation", () => {
  it("throws on adjacent numbers", () => {
    expect(() => calc("1 2")).toThrow();
    expect(() => calc("1 2 + 3")).toThrow();
    expect(() => calc("1 + 2 3")).toThrow();
    expect(() => calc("1+1 2+2")).toThrow();
  });

  it("throws on consecutive operators", () => {
    expect(() => calc("1 ++ 2")).toThrow();
    expect(() => calc("1 +* 2")).toThrow();
    expect(() => calc("1 */ 2")).toThrow();
    expect(() => calc("1 -- 2")).toThrow();
    expect(() => calc("1+++++++1")).toThrow();
    expect(() => calc("2**3")).toThrow();
    expect(() => calc("5--3")).toThrow();
  });

  it("handles valid negation", () => {
    expect(calc("1 + -2")).toBe(-1);
    expect(calc("2 * -3")).toBe(-6);
    expect(calc("6 / -2")).toBe(-3);
    expect(calc("2 ^ -2")).toBe(0.25);
  });

  it("handles complex expressions with negation", () => {
    expect(calc("1 + 2 * -3 + 4")).toBe(-1);
    expect(calc("-1 + 2 * -3")).toBe(-7);
    expect(calc("-(1 + 2)")).toBe(-3);
    expect(calc("(-1 + -2) * 3")).toBe(-9);
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
    expect(calc("1px + 2px")).toBe("3px");
    expect(calc("1rem + 2rem")).toBe("3rem");
  });

  it("handles subtraction with same units", () => {
    expect(calc("5px - 2px")).toBe("3px");
  });

  it("handles multiplication with unitless", () => {
    expect(calc("2px * 3")).toBe("6px");
    expect(calc("2 * 3px")).toBe("6px");
  });

  it("handles division with unitless", () => {
    expect(calc("6px / 2")).toBe("3px");
  });

  it("handles division with same units", () => {
    expect(calc("6px / 2px")).toBe("3");
  });

  it("throws on operations with incompatible units", () => {
    expect(() => calc("1px + 1rem")).toThrow();
    expect(() => calc("1px * 1rem")).toThrow();
    expect(() => calc("1px / 1rem")).toThrow();
  });
});
