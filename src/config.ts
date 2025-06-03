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

// Default unit conversions with basic unitless operations
const defaultUnitConversions: Map<UnitConversionKey, UnitConversionFunction> = new Map([
  // Multiplication with unitless values
  [
    ",*,*", 
    (left, right) => ({
      value: left.value * right.value,
      unit: right.unit
    })
  ],
  [
    "*,*,", 
    (left, right) => ({
      value: left.value * right.value,
      unit: left.unit
    })
  ],
  // Division with unitless values
  [
    "*,/,", 
    (left, right) => ({
      value: left.value / right.value,
      unit: left.unit
    })
  ],
  [
    ",/,*", 
    (left, right) => ({
      value: left.value / right.value,
      unit: null
    })
  ],
  // Division with same units (results in unitless)
  [
    "*,/,*", 
    (left, right) => {
      if (left.unit === right.unit) {
        return {
          value: left.value / right.value,
          unit: null
        };
      }
      throw new Error(`Cannot divide incompatible units: ${left.unit || "unitless"} and ${right.unit || "unitless"}`);
    }
  ]
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
  // Empty string represents unitless values in conversion keys
  const left = leftUnit === null ? "" : leftUnit;
  const right = rightUnit === null ? "" : rightUnit;
  return `${left},${operator},${right}`;
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
