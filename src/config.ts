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

export type UnitConversionFunction = (left: any, right: any) => ConversionOutput;

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

// Default unit conversions
const defaultUnitConversions: Map<UnitConversionKey, UnitConversionFunction> = new Map([
  // Example conversions
  ["px,+,rem", (left, right) => ({ value: left.value + (right.value * 16), unit: "px" })],
  ["rem,+,px", (left, right) => ({ value: (left.value * 16) + right.value, unit: "px" })],
  ["px,-,rem", (left, right) => ({ value: left.value - (right.value * 16), unit: "px" })],
  ["rem,-,px", (left, right) => ({ value: (left.value * 16) - right.value, unit: "px" })],
  // Add more conversions as needed
]);

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
  return {
    allowedUnits: new Set(allowedUnits),
    mathFunctions,
    unitConversions,
  };
}

// Helper function to get a conversion key
export function getConversionKey(
  leftUnit: string | null,
  operator: string,
  rightUnit: string | null
): UnitConversionKey {
  const left = leftUnit || "";
  const right = rightUnit || "";
  return `${left},${operator},${right}`;
}
