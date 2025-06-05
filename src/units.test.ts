import { describe, expect, it } from "vitest";
import { UnitValue } from "./units.js";
import { createConfig, addUnitConversions } from "./config.js";
import { IncompatibleUnitsError } from "./utils/errors.js";

describe("UnitValue with custom unit conversions", () => {
  // Create a config with custom unit conversions using array syntax
  const config = createConfig();
  addUnitConversions(config, [
    // px to rem conversions (assuming 1rem = 16px)
    [
      ["+", "px", "rem"],
      (left, right) => ({ value: left.value + right.value * 16, unit: "px" }),
    ],
    [
      ["+", "rem", "px"],
      (left, right) => ({ value: left.value * 16 + right.value, unit: "px" }),
    ],
    [
      ["-", "px", "rem"],
      (left, right) => ({ value: left.value - right.value * 16, unit: "px" }),
    ],
    [
      ["-", "rem", "px"],
      (left, right) => ({ value: left.value * 16 - right.value, unit: "px" }),
    ],

    // cm to mm conversions (1cm = 10mm)
    [
      ["+", "cm", "mm"],
      (left, right) => ({ value: left.value + right.value / 10, unit: "cm" }),
    ],
    [
      ["+", "mm", "cm"],
      (left, right) => ({ value: left.value + right.value * 10, unit: "mm" }),
    ],
    [
      ["-", "cm", "mm"],
      (left, right) => ({ value: left.value - right.value / 10, unit: "cm" }),
    ],
    [
      ["-", "mm", "cm"],
      (left, right) => ({ value: left.value - right.value * 10, unit: "mm" }),
    ],
  ]);

  describe("unit compatibility", () => {
    it("recognizes compatible units based on config", () => {
      const px = new UnitValue(10, "px", false, config);
      const rem = new UnitValue(1, "rem", false, config);
      const cm = new UnitValue(2, "cm", false, config);
      const mm = new UnitValue(20, "mm", false, config);
      const em = new UnitValue(1, "em", false, config);

      expect(px.isCompatibleWith(rem)).toBe(true);
      expect(rem.isCompatibleWith(px)).toBe(true);
      expect(cm.isCompatibleWith(mm)).toBe(true);
      expect(mm.isCompatibleWith(cm)).toBe(true);

      // Units without conversion rules are not compatible
      expect(px.isCompatibleWith(cm)).toBe(false);
      expect(rem.isCompatibleWith(em)).toBe(false);
    });
  });

  describe("wildcard conversions", () => {
    // Create a config with wildcard conversions using array syntax
    const wildcardConfig = createConfig();
    addUnitConversions(wildcardConfig, [
      // Wildcard for left unit (any unit to px)
      [
        ["+", "*", "px"],
        (left, right) => ({
          value: left.value * 10 + right.value,
          unit: "px",
        }),
      ],
      // Wildcard for right unit (px to any unit)
      [
        ["+", "px", "*"],
        (left, right) => ({
          value: left.value + right.value * 10,
          unit: "px",
        }),
      ],
      // Wildcard for both units (any unit to any unit)
      [
        ["+", "*", "*"],
        (left, right) => ({
          value: left.value + right.value,
          unit: "generic",
        }),
      ],
    ]);

    it("converts using wildcard patterns", () => {
      const px = new UnitValue(10, "px", false, wildcardConfig);
      const em = new UnitValue(2, "em", false, wildcardConfig);
      const rem = new UnitValue(3, "rem", false, wildcardConfig);

      // Test "*,+,px" pattern: any unit to px
      const result1 = em.add(px);
      expect(result1.value).toBe(30); // 2em * 10 + 10px = 30px
      expect(result1.unit).toBe("px");

      // Test "px,+,*" pattern: px to any unit
      const result2 = px.add(rem);
      expect(result2.value).toBe(40); // 10px + 3rem * 10 = 40px
      expect(result2.unit).toBe("px");

      // Test "*,+,*" pattern: any unit to any unit (lowest priority)
      const result3 = em.add(rem);
      expect(result3.value).toBe(5); // 2em + 3rem = 5generic
      expect(result3.unit).toBe("generic");
    });

    it("respects specificity order", () => {
      // Config with both specific and wildcard conversions using array syntax
      const mixedConfig = createConfig();
      addUnitConversions(mixedConfig, [
        // Specific conversion (highest priority)
        [
          ["+", "em", "rem"],
          (left, right) => ({
            value: left.value * 2 + right.value * 3,
            unit: "specific",
          }),
        ],
        // Wildcard for left unit (medium priority)
        [
          ["+", "*", "rem"],
          (left, right) => ({
            value: left.value + right.value * 5,
            unit: "leftWild",
          }),
        ],
        // Wildcard for right unit (medium priority)
        [
          ["+", "em", "*"],
          (left, right) => ({
            value: left.value * 5 + right.value,
            unit: "rightWild",
          }),
        ],
        // Wildcard for both units (lowest priority)
        [
          ["+", "*", "*"],
          (left, right) => ({
            value: left.value + right.value,
            unit: "bothWild",
          }),
        ],
      ]);

      const em = new UnitValue(2, "em", false, mixedConfig);
      const rem = new UnitValue(3, "rem", false, mixedConfig);
      const px = new UnitValue(4, "px", false, mixedConfig);

      // Should use specific conversion
      const result1 = em.add(rem);
      expect(result1.value).toBe(13); // 2em * 2 + 3rem * 3 = 13specific
      expect(result1.unit).toBe("specific");

      // Should use left wildcard
      const result2 = px.add(rem);
      expect(result2.value).toBe(19); // 4px + 3rem * 5 = 19leftWild
      expect(result2.unit).toBe("leftWild");

      // Should use right wildcard
      const result3 = em.add(px);
      expect(result3.value).toBe(14); // 2em * 5 + 4px = 14rightWild
      expect(result3.unit).toBe("rightWild");
    });
  });

  describe("unitless conversions", () => {
    // Create a config with unitless conversions using array syntax
    const unitlessConfig = createConfig();
    addUnitConversions(unitlessConfig, [
      // Unitless to px conversions
      [
        ["+", "px", null],
        (left, right) => ({
          value: left.value + right.value,
          unit: "px",
        }),
      ],
      [
        ["+", null, "px"],
        (left, right) => ({
          value: left.value + right.value,
          unit: "px",
        }),
      ],
      [
        ["-", "px", null],
        (left, right) => ({
          value: left.value - right.value,
          unit: "px",
        }),
      ],
      [
        ["*", null, "px"],
        (left, right) => ({ value: left.value * right.value, unit: "px" }),
      ],
    ]);

    it("converts between unitless and units", () => {
      const px = new UnitValue(10, "px", false, unitlessConfig);
      const unitless = new UnitValue(5, null, false, unitlessConfig);

      const result1 = px.add(unitless);
      expect(result1.value).toBe(15);
      expect(result1.unit).toBe("px");

      const result2 = unitless.add(px);
      expect(result2.value).toBe(15);
      expect(result2.unit).toBe("px");

      const result3 = px.subtract(unitless);
      expect(result3.value).toBe(5);
      expect(result3.unit).toBe("px");

      // 5 * 10px = 50px
      const result4 = unitless.multiply(px);
      expect(result4.value).toBe(50);
      expect(result4.unit).toBe("px");
    });
  });

  describe("unit conversions", () => {
    it("converts px to rem and vice versa during addition", () => {
      const px = new UnitValue(10, "px", false, config);
      const rem = new UnitValue(1, "rem", false, config);

      // 10px + 1rem (16px) = 26px
      const result1 = px.add(rem);
      expect(result1.value).toBe(26);
      expect(result1.unit).toBe("px");

      // 1rem + 10px = 26px
      const result2 = rem.add(px);
      expect(result2.value).toBe(26);
      expect(result2.unit).toBe("px");
    });

    it("converts px to rem and vice versa during subtraction", () => {
      const px = new UnitValue(26, "px", false, config);
      const rem = new UnitValue(1, "rem", false, config);

      // 26px - 1rem (16px) = 10px
      const result1 = px.subtract(rem);
      expect(result1.value).toBe(10);
      expect(result1.unit).toBe("px");

      // 1rem - 10px = 6px
      const rem2 = new UnitValue(1, "rem", false, config);
      const px2 = new UnitValue(10, "px", false, config);
      const result2 = rem2.subtract(px2);
      expect(result2.value).toBe(6);
      expect(result2.unit).toBe("px");
    });

    it("converts cm to mm and vice versa during addition", () => {
      const cm = new UnitValue(1, "cm", false, config);
      const mm = new UnitValue(5, "mm", false, config);

      // 1cm + 5mm = 1.5cm
      const result1 = cm.add(mm);
      expect(result1.value).toBe(1.5);
      expect(result1.unit).toBe("cm");

      // 5mm + 1cm = 15mm
      const result2 = mm.add(cm);
      expect(result2.value).toBe(15);
      expect(result2.unit).toBe("mm");
    });

    it("converts cm to mm and vice versa during subtraction", () => {
      const cm = new UnitValue(1, "cm", false, config);
      const mm = new UnitValue(5, "mm", false, config);

      // 1cm - 5mm = 0.5cm
      const result1 = cm.subtract(mm);
      expect(result1.value).toBe(0.5);
      expect(result1.unit).toBe("cm");

      // 5mm - 1cm = -5mm
      const result2 = mm.subtract(cm);
      expect(result2.value).toBe(-5);
      expect(result2.unit).toBe("mm");
    });
  });

  describe("default unit operations", () => {
    // Use default config which should have the basic unitless operations
    const defaultUnitValue = (value: number, unit: string | null = null) =>
      new UnitValue(value, unit);

    it("multiplies unitless with any unit", () => {
      const unitless = defaultUnitValue(2);
      const px = defaultUnitValue(10, "px");
      const em = defaultUnitValue(3, "em");

      // Unitless * Unit = Unit
      const result1 = unitless.multiply(px);
      expect(result1.value).toBe(20);
      expect(result1.unit).toBe("px");

      // Unit * Unitless = Unit
      const result2 = em.multiply(unitless);
      expect(result2.value).toBe(6);
      expect(result2.unit).toBe("em");

      // Unitless * Unitless = Unitless
      const result3 = unitless.multiply(defaultUnitValue(4));
      expect(result3.value).toBe(8);
      expect(result3.unit).toBe(null);
    });

    it("divides with unitless values", () => {
      const unitless = defaultUnitValue(2);
      const px = defaultUnitValue(10, "px");

      // Unit / Unitless = Unit
      const result1 = px.divide(unitless);
      expect(result1.value).toBe(5);
      expect(result1.unit).toBe("px");

      // Unitless / Unit = Unitless
      const result2 = unitless.divide(px);
      expect(result2.value).toBe(0.2);
      expect(result2.unit).toBe("px");
    });

    it("divides same units to get unitless", () => {
      const px1 = defaultUnitValue(10, "px");
      const px2 = defaultUnitValue(2, "px");

      // px / px = unitless
      const result = px1.divide(px2);
      expect(result.value).toBe(5);
      expect(result.unit).toBe("px");
      expect(result.fromUnitDivision).toBe(true);
    });

    it("throws on incompatible unit operations", () => {
      const px = defaultUnitValue(10, "px");
      const em = defaultUnitValue(2, "em");

      // Cannot multiply or divide incompatible units
      expect(() => px.multiply(em)).toThrow(IncompatibleUnitsError);
      expect(() => px.divide(em)).toThrow(IncompatibleUnitsError);
    });
  });

  describe("error handling", () => {
    it("throws error when adding incompatible units", () => {
      const px = new UnitValue(10, "px", false, config);
      const cm = new UnitValue(2, "cm", false, config);

      expect(() => px.add(cm)).toThrow(IncompatibleUnitsError);
    });

    it("throws error when subtracting incompatible units", () => {
      const px = new UnitValue(10, "px", false, config);
      const cm = new UnitValue(2, "cm", false, config);

      expect(() => px.subtract(cm)).toThrow(IncompatibleUnitsError);
    });
  });
});
