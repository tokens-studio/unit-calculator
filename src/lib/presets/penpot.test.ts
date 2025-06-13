import { describe, expect, it } from "vitest";
import { calc } from "../parser.js";
import { createPenpotConfig } from "./penpot.js";

describe("Penpot config", () => {
  const penpotConfig = createPenpotConfig();

  const customPenpotConfig = createPenpotConfig({
    baseSize: 10,
  });

  describe("Basic configuration", () => {
    it("restricts allowed units", () => {
      expect(calc("10px + 20px", penpotConfig)).toEqual(["30px"]);
      expect(calc("1rem + 2rem", penpotConfig)).toEqual(["3rem"]);
      expect(calc("10% + 20%", penpotConfig)).toEqual(["30%"]);

      // Should throw for unsupported units
      expect(() => calc("10em + 20em", penpotConfig)).toThrow(/Invalid unit/);
      expect(() => calc("10vh", penpotConfig)).toThrow(/Invalid unit/);
    });

    it("disallows strings", () => {
      expect(() => calc("solid", penpotConfig)).toThrow(
        /Strings in expressions are not allowed/
      );
      expect(() => calc("10px solid", penpotConfig)).toThrow(
        /Strings in expressions are not allowed/
      );
    });

    it("disallows multiple expressions", () => {
      expect(() => calc("10px 20px", penpotConfig)).toThrow(
        /Multiple expressions are not allowed/
      );
      expect(() => calc("10px + 20px 30rem", penpotConfig)).toThrow(
        /Multiple expressions are not allowed/
      );
    });
  });

  describe("Unit conversions", () => {
    it("converts between px and rem with default base size", () => {
      // 1rem = 16px
      expect(calc("1rem + 8px", penpotConfig)).toEqual(["24px"]);
      expect(calc("32px - 1rem", penpotConfig)).toEqual(["16px"]);
      expect(calc("1rem + 1rem", penpotConfig)).toEqual(["2rem"]);
    });

    it("converts between px and rem with custom base size", () => {
      // 1rem = 10px
      expect(calc("1rem + 5px", customPenpotConfig)).toEqual(["15px"]);
      expect(calc("20px - 1rem", customPenpotConfig)).toEqual(["10px"]);
    });

    it("handles unitless values", () => {
      expect(calc("10px + 5", penpotConfig)).toEqual(["15px"]);
      expect(calc("2 + 10px", penpotConfig)).toEqual(["12px"]);
    });
  });

  describe("Percent handling", () => {
    it("adds percent to values", () => {
      expect(calc("100px + 10%", penpotConfig)).toEqual(["110px"]);
      expect(calc("100rem + 25%", penpotConfig)).toEqual(["125rem"]);
    });

    it("subtracts percent from values", () => {
      expect(calc("100px - 10%", penpotConfig)).toEqual(["90px"]);
      expect(calc("100rem - 25%", penpotConfig)).toEqual(["75rem"]);
    });

    it("multiplies values by percent", () => {
      expect(calc("100px * 10%", penpotConfig)).toEqual(["10px"]);
      expect(calc("100rem * 25%", penpotConfig)).toEqual(["25rem"]);
    });

    it("divides values by percent", () => {
      expect(calc("100px / 10%", penpotConfig)).toEqual(["1000px"]);
      expect(calc("100rem / 25%", penpotConfig)).toEqual(["400rem"]);
    });
  });

  describe("Complex expressions", () => {
    it("handles complex expressions with mixed units", () => {
      expect(calc("(1rem + 8px) * 2", penpotConfig)).toEqual(["48px"]);
      expect(calc("(32px - 1rem) / 2", penpotConfig)).toEqual(["8px"]);
      expect(calc("1rem + 8px + 10%", penpotConfig)).toEqual(["26.4px"]);
      expect(calc("max(1rem, 10rem)", penpotConfig)).toEqual(["10rem"]);
    });
  });
});
