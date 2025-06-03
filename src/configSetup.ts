import { createConfig, addUnitConversions, CSS_UNITS } from "./config.js";
import { 
  lengthTable, 
  timeTable, 
  weightTable,
  generateConversionsFromTable 
} from "./dimensionUnits.js";

// Base size for rem to px conversion (1rem = 16px)
export const baseSize = 16;

export const createPercentConfig = function () {
  const addPercent = (percent, unit) => ({
    value: (unit.value / 100) * percent.value + unit.value,
    unit: "px",
  });

  const config = createConfig();

  // prettier-ignore
  return addUnitConversions(config, [
    [
      ["%", "+", "*"], (left, right) => addPercent(left, right),
    ],
    [
      ["*", "+", "%"], (left, right) => addPercent(right, left),
    ],
  ]);
};

export function createPenpotConfig() {
  const config = createConfig({
    allowedUnits: new Set(["px", "rem"]),
  });

  addUnitConversions(config, [
    [
      ["px", "+", "rem"],
      (left, right) => ({
        value: left.value + right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "+", "px"],
      (left, right) => ({
        value: left.value * baseSize + right.value,
        unit: "px",
      }),
    ],
    [
      ["px", "-", "rem"],
      (left, right) => ({
        value: left.value - right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "-", "px"],
      (left, right) => ({
        value: left.value * baseSize - right.value,
        unit: "px",
      }),
    ],
    [
      ["px", "+", ""],
      (left, right) => ({
        value: left.value + right.value,
        unit: "px",
      }),
    ],
    [
      ["", "+", "px"],
      (left, right) => ({
        value: left.value + right.value,
        unit: "px",
      }),
    ],
  ]);

  return config;
}

/**
 * Creates a config with dimension unit conversions
 * Includes length (km, m, cm, mm), time (h, min, s, ms), and weight (kg, g, mg) units
 */
export function createDimensionConfig() {
  // Create a config with all dimension units
  const allDimensionUnits = [
    ...Object.keys(lengthTable),
    ...Object.keys(timeTable),
    ...Object.keys(weightTable)
  ];
  
  const config = createConfig({
    allowedUnits: new Set([...CSS_UNITS, ...allDimensionUnits]),
  });

  // Add length unit conversions
  const lengthConversions = [
    ...generateConversionsFromTable(lengthTable, '+'),
    ...generateConversionsFromTable(lengthTable, '-')
  ];
  addUnitConversions(config, lengthConversions);

  // Add time unit conversions
  const timeConversions = [
    ...generateConversionsFromTable(timeTable, '+'),
    ...generateConversionsFromTable(timeTable, '-')
  ];
  addUnitConversions(config, timeConversions);

  // Add weight unit conversions
  const weightConversions = [
    ...generateConversionsFromTable(weightTable, '+'),
    ...generateConversionsFromTable(weightTable, '-')
  ];
  addUnitConversions(config, weightConversions);

  return config;
}

/**
 * Creates a comprehensive config with all supported unit conversions
 */
export function createStandardConfig() {
  // Start with dimension units
  const config = createDimensionConfig();
  
  // Add px/rem conversions
  addUnitConversions(config, [
    [
      ["px", "+", "rem"],
      (left, right) => ({
        value: left.value + right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "+", "px"],
      (left, right) => ({
        value: left.value * baseSize + right.value,
        unit: "px",
      }),
    ],
    [
      ["px", "-", "rem"],
      (left, right) => ({
        value: left.value - right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "-", "px"],
      (left, right) => ({
        value: left.value * baseSize - right.value,
        unit: "px",
      }),
    ],
  ]);
  
  return config;
}
