import { describe, expect, it } from "vitest";

import {
  createDimensionTable,
  generateConversionsFromTable,
  lengthTable,
  timeTable,
  weightTable,
} from "./dimensionUnits.js";
import { createConfig, addUnitConversions } from "./config.js";
import { calc } from "./parser.js";

describe("Dimension Tables", () => {
  it("creates correct conversion table for length units", () => {
    expect(lengthTable["km"]["m"]).toBe(1000);
    expect(lengthTable["m"]["km"]).toBe(0.001);
    expect(lengthTable["m"]["cm"]).toBe(100);
    expect(lengthTable["cm"]["m"]).toBe(0.01);
    expect(lengthTable["cm"]["mm"]).toBe(10);
    expect(lengthTable["mm"]["cm"]).toBe(0.1);

    // Indirect conversions
    expect(lengthTable["km"]["cm"]).toBe(100000);
    expect(lengthTable["km"]["mm"]).toBe(1000000);
    expect(lengthTable["mm"]["km"]).toBe(0.000001);
  });

  it("creates correct conversion table for time units", () => {
    expect(timeTable["h"]["min"]).toBe(60);
    expect(timeTable["min"]["s"]).toBe(60);
    expect(timeTable["s"]["ms"]).toBe(1000);

    // Indirect conversions
    expect(timeTable["h"]["s"]).toBe(3600);
    expect(timeTable["h"]["ms"]).toBe(3600000);
    expect(timeTable["min"]["ms"]).toBe(60000);
  });

  it("creates correct conversion table for weight units", () => {
    expect(weightTable["kg"]["g"]).toBe(1000);
    expect(weightTable["g"]["mg"]).toBe(1000);

    // Indirect conversions
    expect(weightTable["kg"]["mg"]).toBe(1000000);
  });

  it("handles custom dimension tables", () => {
    const customUnits = ["gigantic", "huge", "big", "medium", "small"];
    const customFactors = [10, 5, 2, 3]; // Conversion factors between adjacent units

    const table = createDimensionTable(customUnits, customFactors);

    // Direct conversions
    expect(table["gigantic"]["huge"]).toBe(10);
    expect(table["huge"]["big"]).toBe(5);
    expect(table["big"]["medium"]).toBe(2);
    expect(table["medium"]["small"]).toBe(3);

    // Indirect conversions
    expect(table["gigantic"]["big"]).toBe(50); // 10 * 5
    expect(table["gigantic"]["medium"]).toBe(100); // 10 * 5 * 2
    expect(table["gigantic"]["small"]).toBe(300); // 10 * 5 * 2 * 3
    expect(table["huge"]["small"]).toBe(30); // 5 * 2 * 3

    // Reverse conversions
    expect(table["small"]["medium"]).toBe(1 / 3);
    expect(table["small"]["gigantic"]).toBeCloseTo(1 / 300);
  });

  it("throws when conversion factors don't match units", () => {
    const units = ["a", "b", "c"];
    const factors = [2]; // Should be 2 factors for 3 units

    expect(() => createDimensionTable(units, factors)).toThrow();
  });
});

describe("Unit Conversions from Tables", () => {
  it("generates correct conversion functions", () => {
    // Create a simple table
    const units = ["big", "medium", "small"];
    const factors = [10, 5]; // big->medium->small
    const table = createDimensionTable(units, factors);

    // Generate addition conversions
    const conversions = generateConversionsFromTable(table, "+");

    // Create a config with these conversions
    const config = createConfig({
      allowedUnits: new Set(units),
    });
    addUnitConversions(config, conversions);

    // Test calculations with the config
    expect(calc("1big + 5medium", config)).toEqual(["15medium"]);
    expect(calc("1medium + 10small", config)).toEqual(["15small"]);
    expect(calc("1big + 25small", config)).toEqual(["75small"]);

    // Test subtraction
    const subConversions = generateConversionsFromTable(table, "-");
    addUnitConversions(config, subConversions);

    expect(calc("2big - 5medium", config)).toEqual(["15medium"]);
    expect(calc("5medium - 10small", config)).toEqual(["15small"]);
    expect(calc("2big - 25small", config)).toEqual(["75small"]);
  });
});

describe("Integration with Calculator", () => {
  it("performs calculations with length units", () => {
    const config = createConfig({
      allowedUnits: new Set(["km", "m", "cm", "mm"]),
    });

    // Add length conversions
    const conversions = [
      ...generateConversionsFromTable(lengthTable, "+"),
      ...generateConversionsFromTable(lengthTable, "-"),
    ];
    addUnitConversions(config, conversions);

    // Addition
    expect(calc("1km + 500m", config)).toEqual(["1500m"]);
    expect(calc("1m + 50cm", config)).toEqual(["150cm"]);
    expect(calc("10cm + 5mm", config)).toEqual(["105mm"]);

    // Subtraction
    expect(calc("2km - 500m", config)).toEqual(["1500m"]);
    expect(calc("1m - 20cm", config)).toEqual(["80cm"]);

    // Complex expressions
    expect(calc("(1km + 200m) / 2", config)).toEqual(["600m"]);
    expect(calc("2 * (500m + 50cm)", config)).toEqual(["100100cm"]);
    
    // Multiplication and division
    expect(calc("2km * 3", config)).toEqual(["6km"]);
    expect(calc("6km / 2", config)).toEqual(["3km"]);
    expect(calc("6km / 2km", config)).toEqual(["3"]);
    expect(calc("3m * 2m", config)).toEqual(["6m"]);
  });

  it("performs calculations with time units", () => {
    const config = createConfig({
      allowedUnits: new Set(["h", "min", "s", "ms"]),
    });

    // Add time conversions
    const conversions = [
      ...generateConversionsFromTable(timeTable, "+"),
      ...generateConversionsFromTable(timeTable, "-"),
    ];
    addUnitConversions(config, conversions);

    // Addition
    expect(calc("1h + 30min", config)).toEqual(["90min"]);
    expect(calc("1min + 30s", config)).toEqual(["90s"]);

    // Subtraction
    expect(calc("1h - 15min", config)).toEqual(["45min"]);
    expect(calc("1min - 15s", config)).toEqual(["45s"]);

    // Complex expressions
    expect(calc("(2h + 30min) / 2", config)).toEqual(["75min"]);
    
    // Multiplication and division
    expect(calc("2h * 3", config)).toEqual(["6h"]);
    expect(calc("6h / 2", config)).toEqual(["3h"]);
    expect(calc("6h / 2h", config)).toEqual(["3"]);
  });

  it("performs calculations with weight units", () => {
    const config = createConfig({
      allowedUnits: new Set(["kg", "g", "mg"]),
    });

    // Add weight conversions
    const conversions = [
      ...generateConversionsFromTable(weightTable, "+"),
      ...generateConversionsFromTable(weightTable, "-"),
    ];
    addUnitConversions(config, conversions);

    // Addition
    expect(calc("1kg + 500g", config)).toEqual(["1500g"]);
    expect(calc("1g + 500mg", config)).toEqual(["1500mg"]);

    // Subtraction
    expect(calc("2kg - 500g", config)).toEqual(["1500g"]);

    // Complex expressions
    expect(calc("(1kg + 200g) * 2", config)).toEqual(["2400g"]);
    
    // Multiplication and division
    expect(calc("2kg * 3", config)).toEqual(["6kg"]);
    expect(calc("6kg / 2", config)).toEqual(["3kg"]);
    expect(calc("6kg / 2kg", config)).toEqual(["3"]);
    expect(calc("3g * 2g", config)).toEqual(["6g"]);
  });
});
