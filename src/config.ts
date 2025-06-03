export const CSS_UNITS = [
  "px",
  "em",
  "rem",
  "%",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
];

export type UnitConversionKey = string;

interface ConversionOutput {
  value: number;
  unit: string | null;
}

export type UnitConversionFunction = (
  left: any,
  right: any
) => ConversionOutput;

export interface CalcConfig {
  allowedUnits: Set<string>;
  mathFunctions: Record<string, (...args: number[]) => number>;
  unitConversions: Map<UnitConversionKey, UnitConversionFunction>;
}

export const defaultMathFunctions: Record<
  string,
  (...args: number[]) => number
> = {
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  log: Math.log,
  exp: Math.exp,
  pow: Math.pow,
  max: Math.max,
  min: Math.min,
};

// Create default unit conversions with array syntax
export const defaultConversionsArray: Array<
  [UnitConversionKeyArray, UnitConversionFunction]
> = [
  // Multiplication with unitless values
  [
    [null, "*", "*"],
    (left, right) => ({
      value: left.value * right.value,
      unit: right.unit,
    }),
  ],
  [
    ["*", "*", null],
    (left, right) => ({
      value: left.value * right.value,
      unit: left.unit,
    }),
  ],
  // Division with unitless values
  [
    ["*", "/", null],
    (left, right) => ({
      value: left.value / right.value,
      unit: left.unit,
    }),
  ],
  [
    [null, "/", "*"],
    (left, right) => ({
      value: left.value / right.value,
      unit: null,
    }),
  ],
  // Division with same units (results in unitless)
  [
    ["*", "/", "*"],
    (left, right) => {
      if (left.unit === right.unit) {
        return {
          value: left.value / right.value,
          unit: null,
        };
      }
      throw new Error(
        `Cannot divide incompatible units: ${left.unit || "unitless"} and ${
          right.unit || "unitless"
        }`
      );
    },
  ],
];

// Convert array format to Map
export const defaultUnitConversions: Map<
  UnitConversionKey,
  UnitConversionFunction
> = new Map(
  defaultConversionsArray.map(([keyArray, fn]) => [
    arrayToConversionKey(keyArray),
    fn,
  ])
);

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
  mathFunctions: defaultMathFunctions,
  unitConversions: defaultUnitConversions,
};

export function createConfig({
  allowedUnits = defaultConfig.allowedUnits,
  mathFunctions = defaultConfig.mathFunctions,
  unitConversions = defaultConfig.unitConversions,
}: Partial<CalcConfig> = {}): CalcConfig {
  // Process unit conversions to handle array format
  const processedConversions = new Map<
    UnitConversionKey,
    UnitConversionFunction
  >();

  // Copy existing conversions
  unitConversions.forEach((fn, key) => {
    processedConversions.set(key, fn);
  });

  return {
    allowedUnits: new Set(allowedUnits),
    mathFunctions,
    unitConversions: processedConversions,
  };
}

// Helper function to add unit conversions with array syntax
export function addUnitConversions(
  config: CalcConfig,
  conversions: Array<[UnitConversionKeyArray, UnitConversionFunction]>
): CalcConfig {
  conversions.forEach(([keyArray, fn]) => {
    const key = arrayToConversionKey(keyArray);
    config.unitConversions.set(key, fn);
  });
  return config;
}

// Types for the array-based conversion key format
export type UnitConversionKeyArray = [string | null, string, string | null];

// Helper function to get a conversion key
export function getConversionKey(
  leftUnit: string | null,
  operator: string,
  rightUnit: string | null
): UnitConversionKey {
  // Empty string represents unitless values in conversion keys
  const left = leftUnit === null ? "" : leftUnit;
  const right = rightUnit === null ? "" : rightUnit;
  return `${left},${operator},${right}`;
}

// Helper function to convert array format to string key
export function arrayToConversionKey(
  keyArray: UnitConversionKeyArray
): UnitConversionKey {
  const [leftUnit, operator, rightUnit] = keyArray;
  return getConversionKey(leftUnit, operator, rightUnit);
}

// Function to find the best matching conversion key
export function findBestConversionKey(
  unitConversions: Map<UnitConversionKey, UnitConversionFunction>,
  leftUnit: string | null,
  operator: string,
  rightUnit: string | null
): UnitConversionFunction | undefined {
  // Try exact match first
  const exactKey = getConversionKey(leftUnit, operator, rightUnit);
  if (unitConversions.has(exactKey)) {
    return unitConversions.get(exactKey);
  }

  // Try wildcard patterns in order of specificity
  // 1. Left specific, right wildcard
  const leftWildcardKey = getConversionKey(leftUnit, operator, "*");
  if (unitConversions.has(leftWildcardKey)) {
    return unitConversions.get(leftWildcardKey);
  }

  // 2. Right specific, left wildcard
  const rightWildcardKey = getConversionKey("*", operator, rightUnit);
  if (unitConversions.has(rightWildcardKey)) {
    return unitConversions.get(rightWildcardKey);
  }

  // 3. Both wildcard
  const bothWildcardKey = getConversionKey("*", operator, "*");
  if (unitConversions.has(bothWildcardKey)) {
    return unitConversions.get(bothWildcardKey);
  }

  // No match found
  return undefined;
}
