import type {
  UnitConversionKey,
  UnitConversionFunction,
} from "./unitConversions.js";
import {
  defaultUnitConversions,
  addUnitConversions,
  findBestConversionKey,
  getConversionKey,
} from "./unitConversions.js";

import type {
  FunctionUnitConversionKey,
  FunctionUnitConversionFunction,
} from "./functionUnitConversions.js";
import {
  defaultFunctionUnitConversions,
  addFunctionUnitConversions,
  findBestFunctionConversionKey,
} from "./functionUnitConversions.js";

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

// Re-export for backward compatibility
export type {
  UnitConversionKey,
  UnitConversionFunction,
  FunctionUnitConversionKey,
  FunctionUnitConversionFunction,
};
export {
  addUnitConversions,
  findBestConversionKey,
  getConversionKey,
  defaultUnitConversions,
  addFunctionUnitConversions,
  findBestFunctionConversionKey,
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
