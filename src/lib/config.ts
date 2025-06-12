import { IncompatibleUnitsError } from "./utils/errors.js";
import { UnitValue } from "./units.js";
import type { IUnitValue } from "./utils/units.d.js";
import type {
  AllowedUnits,
  ConversionOutput,
  UnitConversionFunction,
  UnitConversionKey,
  CalcConfig,
} from "./config.d.js";
import { CSS_UNITS } from "./utils/constants.js";

export type {
  UnitConversionKey,
  ConversionOutput,
  UnitConversionFunction,
  CalcConfig,
  AllowedUnits,
} from "./config.d.js";

export const defaultMathFunctions: Record<
  string,
  (...args: IUnitValue[]) => ConversionOutput
> = {
  abs: ({ value, unit }: IUnitValue) => {
    const result = Math.abs(value);
    return { value: result, unit };
  },
  sin: ({ value, unit }: IUnitValue) => {
    const result = Math.sin(value);
    return { value: result, unit };
  },
  cos: ({ value, unit }: IUnitValue) => {
    const result = Math.cos(value);
    return { value: result, unit };
  },
  tan: ({ value, unit }: IUnitValue) => {
    const result = Math.tan(value);
    return { value: result, unit };
  },
  sqrt: ({ value, unit }: IUnitValue) => {
    const result = Math.sqrt(value);
    return { value: result, unit };
  },
  floor: ({ value, unit }: IUnitValue) => {
    const result = Math.floor(value);
    return { value: result, unit };
  },
  ceil: ({ value, unit }: IUnitValue) => {
    const result = Math.ceil(value);
    return { value: result, unit };
  },
  round: ({ value, unit }: IUnitValue) => {
    const result = Math.round(value);
    return { value: result, unit };
  },
  log: ({ value, unit }: IUnitValue) => {
    const result = Math.log(value);
    return { value: result, unit };
  },
  exp: ({ value, unit }: IUnitValue) => {
    const result = Math.exp(value);
    return { value: result, unit };
  },
  pow: (...unitValues: IUnitValue[]) => {
    if (unitValues.length !== 2) {
      throw new Error("pow function requires exactly 2 arguments");
    }

    const [base, exp] = unitValues;

    // Exponent must be unitless
    if (exp.unit !== null) {
      throw new IncompatibleUnitsError({
        operation: "pow",
        left: base,
        right: exp,
      });
    }

    const result = Math.pow(base.value, exp.value);
    return { value: result, unit: base.unit };
  },
  max: (...unitValues: IUnitValue[]) => {
    if (unitValues.length === 0) return { value: NaN, unit: null };

    if (!UnitValue.areAllSame(unitValues)) {
      throw new IncompatibleUnitsError({
        operation: "max",
        left: unitValues[0],
        right: unitValues[0],
      });
    }

    const { unit } = unitValues[0];
    const values = unitValues.map(({ value }) => value);
    const result = Math.max(...values);
    return { value: result, unit };
  },
  min: (...unitValues: IUnitValue[]) => {
    if (unitValues.length === 0) return { value: NaN, unit: null };

    if (!UnitValue.areAllSame(unitValues)) {
      throw new IncompatibleUnitsError({
        operation: "min",
        left: unitValues[0],
        right: unitValues[0],
      });
    }

    const { unit } = unitValues[0];
    const values = unitValues.map(({ value }) => value);
    const result = Math.min(...values);
    return { value: result, unit };
  },
};

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
      unit: right.unit,
    }),
  ],
  // Division with same units (results in unitless)
  [
    ["*", "/", "*"],
    (left, right) => {
      if (left.unit === right.unit) {
        return {
          value: left.value / right.value,
          unit: left.unit,
        };
      }
      throw new IncompatibleUnitsError({ operation: "/", left, right });
    },
  ],
];

export const defaultUnitConversions: Map<
  UnitConversionKey,
  UnitConversionFunction
> = new Map(
  defaultConversionsArray.map(([keyArray, fn]) => [
    arrayToConversionKey(keyArray),
    fn,
  ])
);

export const defaultMathConstants: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
  SQRT1_2: Math.SQRT1_2,
  SQRT2: Math.SQRT2,
};

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
  mathFunctions: defaultMathFunctions,
  mathConstants: defaultMathConstants,
  unitConversions: defaultUnitConversions,
};

export function createConfig({
  allowedUnits = defaultConfig.allowedUnits,
  mathFunctions = defaultConfig.mathFunctions,
  mathConstants = defaultConfig.mathConstants,
  unitConversions = defaultConfig.unitConversions,
}: Partial<CalcConfig> = {}): CalcConfig {
  const processedConversions = new Map<
    UnitConversionKey,
    UnitConversionFunction
  >();

  unitConversions.forEach((fn: UnitConversionFunction, key: string) => {
    processedConversions.set(key, fn);
  });

  return {
    allowedUnits: new Set(allowedUnits),
    mathFunctions,
    mathConstants,
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

export function arrayToConversionKey(
  keyArray: UnitConversionKeyArray
): UnitConversionKey {
  const [leftUnit, operator, rightUnit] = keyArray;
  return getConversionKey(leftUnit, operator, rightUnit);
}

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
}
