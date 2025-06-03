import { describe, expect, it, test } from "vitest";
import { CalcConfig, defaultMathFunctions } from "./config.js";
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

  it("throws on commas outside function calls", () => {
    expect(() => calc("1, 2")).toThrow(/Commas are only allowed inside/);
    expect(() => calc("1 + 2, 3 * 4")).toThrow(
      /Commas are only allowed inside/
    );
    expect(() => calc("max(1, 2), 3")).toThrow(
      /Commas are only allowed inside/
    );
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

  it("respects custom allowed units", () => {
    // Only allow px unit
    const options: Partial<CalcConfig> = {
      allowedUnits: new Set(["px"]),
    };

    // Should work with px
    expect(calc("1px + 2px", options)).toEqual(["3px"]);

    // Should throw with rem
    expect(() => calc("1rem + 2rem", options)).toThrow(/Invalid unit/);
  });

  it("allows custom units not in CSS_UNITS", () => {
    // Create a set with a custom unit
    const options: Partial<CalcConfig> = {
      allowedUnits: new Set(["custom"]),
    };

    expect(calc("1custom + 2custom", options)).toEqual(["3custom"]);
    expect(() => calc("1px", options)).toThrow(/Invalid unit/);
  });
});

describe("Unit conversions", () => {
  it("handles custom unit conversions", () => {
    // Create a config with custom unit conversions
    const options: Partial<CalcConfig> = {
      unitConversions: new Map([
        // px to rem conversions (assuming 1rem = 16px)
        [
          "px,+,rem",
          (left, right) => ({
            value: left.value + right.value * 16,
            unit: "px",
          }),
        ],
        [
          "rem,+,px",
          (left, right) => ({
            value: left.value * 16 + right.value,
            unit: "px",
          }),
        ],
        [
          "px,-,rem",
          (left, right) => ({
            value: left.value - right.value * 16,
            unit: "px",
          }),
        ],
        [
          "rem,-,px",
          (left, right) => ({
            value: left.value * 16 - right.value,
            unit: "px",
          }),
        ],
      ]),
    };

    // Addition with unit conversion
    expect(calc("10px + 1rem", options)).toEqual(["26px"]);
    expect(calc("1rem + 10px", options)).toEqual(["26px"]);

    // Subtraction with unit conversion
    expect(calc("26px - 1rem", options)).toEqual(["10px"]);
    expect(calc("1rem - 10px", options)).toEqual(["6px"]);

    // Complex expressions with unit conversions
    expect(calc("2 * (10px + 0.5rem)", options)).toEqual(["36px"]);
    expect(calc("(1rem - 8px) * 2", options)).toEqual(["16px"]);
  });

  it("throws on incompatible units without conversion", () => {
    // Config with only px to rem conversions
    const options: Partial<CalcConfig> = {
      unitConversions: new Map([
        [
          "px,+,rem",
          (left, right) => ({
            value: left.value + right.value * 16,
            unit: "px",
          }),
        ],
      ]),
    };

    // Should throw for units without conversion rules
    expect(() => calc("10px + 1em", options)).toThrow();
    expect(() => calc("1rem - 10%", options)).toThrow();
  });

  it("handles wildcard unit conversions", () => {
    // Config with wildcard conversions
    const options: Partial<CalcConfig> = {
      unitConversions: new Map([
        // Wildcard for left unit (any unit to px)
        [
          "*,+,px",
          (left, right) => ({
            value: left.value * 10 + right.value,
            unit: "px",
          }),
        ],
        // Wildcard for right unit (px to any unit)
        [
          "px,+,*",
          (left, right) => ({
            value: left.value + right.value * 10,
            unit: "px",
          }),
        ],
        // Wildcard for both units (any unit to any unit)
        [
          "*,+,*",
          (left, right) => ({
            value: left.value + right.value,
            unit: "generic",
          }),
        ],
      ]),
    };

    // Test wildcard conversions
    expect(calc("10px + 2em", options)).toEqual(["30px"]); // 10px + 2em*10 = 30px
    expect(calc("2em + 10px", options)).toEqual(["30px"]); // 2em*10 + 10px = 30px
    expect(calc("2em + 3rem", options)).toEqual(["5generic"]); // 2em + 3rem = 5generic
    
    // Test with complex expressions
    expect(calc("2 * (5px + 3em)", options)).toEqual(["70px"]); // 2 * (5px + 3em*10) = 70px
    expect(calc("(2em + 3rem) / 5", options)).toEqual(["1generic"]); // (2em + 3rem) / 5 = 1generic
  });

  it("handles unitless to unit conversions", () => {
    // Config with unitless to px conversions
    const options: Partial<CalcConfig> = {
      unitConversions: new Map([
        // Unitless to px conversions (multiply unitless by 2)
        [
          "px,+,",
          (left, right) => ({
            value: left.value + right.value * 2,
            unit: "px",
          }),
        ],
        [
          ",+,px",
          (left, right) => ({
            value: left.value * 2 + right.value,
            unit: "px",
          }),
        ],
      ]),
    };

    // Addition with unitless conversion
    expect(calc("10px + 5", options)).toEqual(["20px"]);
    expect(calc("5 + 10px", options)).toEqual(["20px"]);
    
    // Complex expressions with unitless conversions
    expect(calc("2 * (10px + 5)", options)).toEqual(["40px"]);
    expect(calc("(5 + 10px) / 2", options)).toEqual(["10px"]);
  });

  it("handles functions with converted units", () => {
    const options: Partial<CalcConfig> = {
      unitConversions: new Map([
        [
          "px,+,rem",
          (left, right) => ({
            value: left.value + right.value * 16,
            unit: "px",
          }),
        ],
        [
          "rem,+,px",
          (left, right) => ({
            value: left.value * 16 + right.value,
            unit: "px",
          }),
        ],
      ]),
    };
    expect(calc("round(10.5px + 0.3rem)", options)).toEqual(["15px"]);
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

describe("Custom math functions", () => {
  test("Default math functions work", () => {
    expect(calc("sin(0)")).toEqual([0]);
    expect(calc("cos(0)")).toEqual([1]);
    expect(calc("sqrt(4)")).toEqual([2]);
    expect(calc("floor(3.7)")).toEqual([3]);
    expect(calc("ceil(3.2)")).toEqual([4]);
    expect(calc("round(3.5)")).toEqual([4]);
    expect(calc("max(1, 2)")).toEqual([2]);
    expect(calc("min(1, 2, 3)")).toEqual([1]);
  });

  test("All functions maintain units", () => {
    const options = {
      allowedUnits: new Set(["cm", "in", "m", "px"]),
    };

    expect(calc("floor(3.7cm)", options)).toEqual(["3cm"]);
    expect(calc("ceil(3.2in)", options)).toEqual(["4in"]);
    expect(calc("abs(-5m)", options)).toEqual(["5m"]);
    expect(calc("round(3.5m)", options)).toEqual(["4m"]);
    expect(calc("sin(0.5cm)", options)).toEqual(["0.479425538604203cm"]);
    expect(calc("sqrt(4px)", options)).toEqual(["2px"]);
    expect(calc("max(1cm, 2cm)", options)).toEqual(["2cm"]);
    expect(calc("min(1px, 2px, 3px)", options)).toEqual(["1px"]);
  });

  test("Custom math functions can be added", () => {
    const customFunctions = {
      double: (x: number) => x * 2,
      triple: (x: number) => x * 3,
      square: (x: number) => x * x,
    };

    expect(calc("double(5)", { mathFunctions: customFunctions })).toEqual([10]);
    expect(calc("triple(4)", { mathFunctions: customFunctions })).toEqual([12]);
    expect(calc("square(3)", { mathFunctions: customFunctions })).toEqual([9]);
  });

  test("Custom functions with units", () => {
    const customFunctions = {
      double: (x: number) => x * 2,
      square: (x: number) => x * x,
      sum: (a: number, b: number) => a + b,
    };

    // All functions preserve units
    expect(calc("square(3cm)", { mathFunctions: customFunctions })).toEqual([
      "9cm",
    ]);

    expect(
      calc("double(3cm)", {
        mathFunctions: customFunctions,
      })
    ).toEqual(["6cm"]);

    expect(
      calc("sum(2cm, 3cm)", {
        mathFunctions: customFunctions,
      })
    ).toEqual(["5cm"]);
  });

  test("Custom functions can be combined with default functions", () => {
    const customFunctions = {
      ...defaultMathFunctions,
      double: (x: number) => x * 2,
    };

    expect(
      calc("sin(double(PI/4))", { mathFunctions: customFunctions })
    ).toEqual([1]);
    expect(calc("sqrt(double(8))", { mathFunctions: customFunctions })).toEqual(
      [4]
    );
  });

  test("Custom functions can be used in complex expressions", () => {
    const customFunctions = {
      double: (x: number) => x * 2,
      half: (x: number) => x / 2,
      add: (a: number, b: number) => a + b,
    };

    expect(
      calc("double(5) + half(8)", { mathFunctions: customFunctions })
    ).toEqual([14]);
    expect(
      calc("double(3cm * 2) + 2cm", { mathFunctions: customFunctions })
    ).toEqual(["14cm"]);
    expect(
      calc("add(double(2), half(8))", { mathFunctions: customFunctions })
    ).toEqual([8]);
  });

  test("Functions with multiple arguments use argument units", () => {
    const customFunctions = {
      add: (a: number, b: number) => a + b,
      max: Math.max,
      min: Math.min,
    };

    const options = {
      mathFunctions: customFunctions,
      allowedUnits: new Set(["px", "em", "rem"]),
    };

    // When all arguments have the same unit, result has that unit
    expect(calc("add(2px, 3px)", options)).toEqual(["5px"]);
    expect(calc("max(1em, 2em, 3em)", options)).toEqual(["3em"]);
    expect(calc("min(1rem, 2rem, 0.5rem)", options)).toEqual(["0.5rem"]);

    // When all arguments are unitless, result is unitless
    expect(calc("add(2, 3)", options)).toEqual([5]);
    expect(calc("max(1, 2, 3)", options)).toEqual([3]);
    expect(calc("min(1, 2, 0.5)", options)).toEqual([0.5]);
  });

  test("Functions throw error when mixing different units", () => {
    const customFunctions = {
      add: (a: number, b: number) => a + b,
      max: Math.max,
      min: Math.min,
    };

    const options = {
      mathFunctions: customFunctions,
      allowedUnits: new Set(["px", "em", "rem"]),
    };

    // Should throw when mixing different units
    expect(() => calc("add(2px, 3em)", options)).toThrow(
      /Cannot mix incompatible units/
    );
    expect(() => calc("max(1px, 2em, 3rem)", options)).toThrow(
      /Cannot mix incompatible units/
    );
    expect(() => calc("min(1rem, 2px)", options)).toThrow(
      /Cannot mix incompatible units/
    );

    // Should throw when mixing unitless with units
    expect(() => calc("add(2px, 3)", options)).toThrow(
      /Cannot mix incompatible units/
    );
    expect(() => calc("max(1, 2em, 3)", options)).toThrow(
      /Cannot mix incompatible units/
    );
    expect(() => calc("min(1rem, 2)", options)).toThrow(
      /Cannot mix incompatible units/
    );
  });

  test("Functions require at least one argument", () => {
    expect(() => calc("sin()")).toThrow(/called with no arguments/);
    expect(() => calc("max()")).toThrow(/called with no arguments/);

    const customFunctions = {
      double: (x: number) => x * 2,
    };

    expect(() => calc("double()", { mathFunctions: customFunctions })).toThrow(
      /called with no arguments/
    );
  });

  test("Functions allow math expressions as arguments", () => {
    expect(calc("abs(1 + 1)")).toEqual([2]);
    expect(calc("abs(-2 * 3)")).toEqual([6]);
    expect(calc("sin(PI / 2)")).toEqual([1]);
    expect(calc("max(1 + 2, 2 * 2)")).toEqual([4]);
    expect(calc("min(3 - 1, 5 / 2, 1 + 0.5)")).toEqual([1.5]);

    // With units
    expect(calc("abs(2px - 5px)")).toEqual(["3px"]);
    expect(calc("max(1px + 2px, 2px * 2)")).toEqual(["4px"]);
  });
});
