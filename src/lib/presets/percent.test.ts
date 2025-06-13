import { describe, expect, it } from "vitest";
import { calc } from "../parser.js";
import { createPercentConfig } from "./percent.js";

describe("Percent config", () => {
  const percentConfig = createPercentConfig();

  describe("Addition with percent", () => {
    it("adds percent to values", () => {
      expect(calc("100px + 10%", percentConfig)).toEqual(["110px"]);
      expect(calc("100rem + 25%", percentConfig)).toEqual(["125rem"]);
      expect(calc("80em + 50%", percentConfig)).toEqual(["120em"]);
    });

    it("adds values to percent", () => {
      expect(calc("10% + 100px", percentConfig)).toEqual(["110px"]);
      expect(calc("25% + 100rem", percentConfig)).toEqual(["125rem"]);
    });
  });

  describe("Subtraction with percent", () => {
    it("subtracts percent from values", () => {
      expect(calc("100px - 10%", percentConfig)).toEqual(["90px"]);
      expect(calc("100rem - 25%", percentConfig)).toEqual(["75rem"]);
      expect(calc("80em - 50%", percentConfig)).toEqual(["40em"]);
    });

    it("subtracts values from percent", () => {
      expect(calc("10% - 100px", percentConfig)).toEqual(["-90px"]);
      expect(calc("25% - 100rem", percentConfig)).toEqual(["-75rem"]);
    });
  });

  describe("Multiplication with percent", () => {
    it("multiplies values by percent", () => {
      expect(calc("100px * 10%", percentConfig)).toEqual(["10px"]);
      expect(calc("100rem * 25%", percentConfig)).toEqual(["25rem"]);
      expect(calc("80em * 50%", percentConfig)).toEqual(["40em"]);
    });

    it("multiplies percent by values", () => {
      expect(calc("10% * 100px", percentConfig)).toEqual(["10px"]);
      expect(calc("25% * 100rem", percentConfig)).toEqual(["25rem"]);
    });
  });

  describe("Division with percent", () => {
    it("divides values by percent", () => {
      expect(calc("100px / 10%", percentConfig)).toEqual(["1000px"]);
      expect(calc("100rem / 25%", percentConfig)).toEqual(["400rem"]);
      expect(calc("80em / 50%", percentConfig)).toEqual(["160em"]);
    });

    it("divides percent by values", () => {
      expect(calc("10% / 2px", percentConfig)).toEqual(["5%"]);
      expect(calc("100% / 4rem", percentConfig)).toEqual(["25%"]);
    });
  });

  describe("Complex expressions with percent", () => {
    it("handles complex expressions with percent", () => {
      expect(calc("(100px + 10%) * 2", percentConfig)).toEqual(["220px"]);
      expect(calc("(200px - 50%) / 2", percentConfig)).toEqual(["50px"]);
      expect(calc("max(100px * 10%, 5px)", percentConfig)).toEqual(["10px"]);
    });
  });

  describe("Multiple expressions with percent", () => {
    it("handles multiple expressions with percent", () => {
      expect(calc("100px + 10% 200rem - 25%", percentConfig)).toEqual([
        "110px",
        "150rem",
      ]);
    });
  });
});
