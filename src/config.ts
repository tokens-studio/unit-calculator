import { IncompatibleUnitsError } from "./utils/errors.js";

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

// Function unit conversion types
export type FunctionUnitConversionKey = string;

export type FunctionUnitConversionFunction = (args: any[]) => {
  value: number;
  unit: string | null;
};

export interface CalcConfig {
  allowedUnits: Set<string>;
  mathFunctions: Record<string, (...args: number[]) => number>;
  unitConversions: Map<UnitConversionKey, UnitConversionFunction>;
  functionUnitConversions: Map<
    FunctionUnitConversionKey,
    FunctionUnitConversionFunction
  >;
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
    ["*", null, "*"],
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
    ["/", "*", null],
    (left, right) => ({
      value: left.value / right.value,
      unit: left.unit,
    }),
  ],
  [
    ["/", null, "*"],
    (left, right) => ({
      value: left.value / right.value,
      unit: null,
    }),
  ],
  // Division with same units (results in unitless)
  [
    ["/", "*", "*"],
    (left, right) => {
      if (left.unit === right.unit) {
        return {
          value: left.value / right.value,
          unit: null,
        };
      }
      throw new IncompatibleUnitsError({ operation: "/", left, right });
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

// Default function unit conversions
export const defaultFunctionUnitConversions: Map<
  FunctionUnitConversionKey,
  FunctionUnitConversionFunction
> = new Map();

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
  mathFunctions: defaultMathFunctions,
  unitConversions: defaultUnitConversions,
  functionUnitConversions: defaultFunctionUnitConversions,
};

export function createConfig({
  allowedUnits = defaultConfig.allowedUnits,
  mathFunctions = defaultConfig.mathFunctions,
  unitConversions = defaultConfig.unitConversions,
  functionUnitConversions = defaultConfig.functionUnitConversions,
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

  // Process function unit conversions
  const processedFunctionConversions = new Map<
    FunctionUnitConversionKey,
    FunctionUnitConversionFunction
  >();

  // Copy existing function conversions
  functionUnitConversions.forEach((fn, key) => {
    processedFunctionConversions.set(key, fn);
  });

  return {
    allowedUnits: new Set(allowedUnits),
    mathFunctions,
    unitConversions: processedConversions,
    functionUnitConversions: processedFunctionConversions,
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

// Type for function unit conversion array format
export type FunctionUnitConversionKeyArray = [string, (string | null)[]];

// Helper function to add function unit conversions with array syntax
export function addFunctionUnitConversions(
  config: CalcConfig,
  conversions: Array<
    [FunctionUnitConversionKeyArray, FunctionUnitConversionFunction]
  >
): CalcConfig {
  conversions.forEach(([keyArray, fn]) => {
    const [functionName, units] = keyArray;
    const key = getFunctionConversionKey(functionName, units);
    config.functionUnitConversions.set(key, fn);
  });
  return config;
}

// Types for the array-based conversion key format
export type UnitConversionKeyArray = [string, string | null, string | null];

// Helper function to get a conversion key
export function getConversionKey(
  operator: string,
  leftUnit: string | null,
  rightUnit: string | null
): UnitConversionKey {
  // Empty string represents unitless values in conversion keys
  const left = leftUnit === null ? "" : leftUnit;
  const right = rightUnit === null ? "" : rightUnit;
  return `${operator},${left},${right}`;
}

// Helper function to convert array format to string key
export function arrayToConversionKey(
  keyArray: UnitConversionKeyArray
): UnitConversionKey {
  const [operator, leftUnit, rightUnit] = keyArray;
  return getConversionKey(operator, leftUnit, rightUnit);
}

// Function to find the best matching conversion key
export function findBestConversionKey(
  unitConversions: Map<UnitConversionKey, UnitConversionFunction>,
  leftUnit: string | null,
  operator: string,
  rightUnit: string | null
): UnitConversionFunction | undefined {
  // Try exact match first
  const exactKey = getConversionKey(operator, leftUnit, rightUnit);
  if (unitConversions.has(exactKey)) {
    return unitConversions.get(exactKey);
  }

  // Try wildcard patterns in order of specificity
  // 1. Left specific, right wildcard
  const leftWildcardKey = getConversionKey(operator, leftUnit, "*");
  if (unitConversions.has(leftWildcardKey)) {
    return unitConversions.get(leftWildcardKey);
  }

  // 2. Right specific, left wildcard
  const rightWildcardKey = getConversionKey(operator, "*", rightUnit);
  if (unitConversions.has(rightWildcardKey)) {
    return unitConversions.get(rightWildcardKey);
  }

  // 3. Both wildcard
  const bothWildcardKey = getConversionKey(operator, "*", "*");
  if (unitConversions.has(bothWildcardKey)) {
    return unitConversions.get(bothWildcardKey);
  }

  // No match found
  return undefined;
}

// Helper function to get a function conversion key
export function getFunctionConversionKey(
  functionName: string,
  units: (string | null)[]
): FunctionUnitConversionKey {
  const unitPart = units.map((unit) => (unit === null ? "" : unit)).join(",");
  return `${functionName},${unitPart}`;
}

// Function to find the best matching function conversion key
export function findBestFunctionConversionKey(
  functionUnitConversions: Map<
    FunctionUnitConversionKey,
    FunctionUnitConversionFunction
  >,
  functionName: string,
  units: (string | null)[]
): FunctionUnitConversionFunction | undefined {
  // Try exact match first
  const exactKey = getFunctionConversionKey(functionName, units);
  if (functionUnitConversions.has(exactKey)) {
    return functionUnitConversions.get(exactKey);
  }

  // Try with wildcards, replacing one unit at a time with wildcard
  for (let i = 0; i < units.length; i++) {
    const wildcardUnits = [...units];
    wildcardUnits[i] = "*";
    const wildcardKey = getFunctionConversionKey(functionName, wildcardUnits);
    if (functionUnitConversions.has(wildcardKey)) {
      return functionUnitConversions.get(wildcardKey);
    }
  }

  // Try with all wildcards
  const allWildcardKey = getFunctionConversionKey(
    functionName,
    Array(units.length).fill("*")
  );
  if (functionUnitConversions.has(allWildcardKey)) {
    return functionUnitConversions.get(allWildcardKey);
  }

  // No match found
  return undefined;
}
