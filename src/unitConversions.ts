import { IncompatibleUnitsError } from "./utils/errors.js";

export type UnitConversionKey = string;

interface ConversionOutput {
  value: number;
  unit: string | null;
}

export type UnitConversionFunction = (
  left: any,
  right: any
) => ConversionOutput;

export type UnitConversionKeyArray = [string, string | null, string | null];

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

export function arrayToConversionKey(
  keyArray: UnitConversionKeyArray
): UnitConversionKey {
  const [operator, leftUnit, rightUnit] = keyArray;
  return getConversionKey(operator, leftUnit, rightUnit);
}

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
}

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
      unit: right.unit,
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

export const defaultUnitConversions: Map<
  UnitConversionKey,
  UnitConversionFunction
> = new Map(
  defaultConversionsArray.map(([keyArray, fn]) => [
    arrayToConversionKey(keyArray),
    fn,
  ])
);

// Export the array version for use in tests and spreading
export const defaultUnitConversionsEntries = defaultConversionsArray.map(
  ([keyArray, fn]) => [arrayToConversionKey(keyArray), fn]
);

// Helper function to add unit conversions with array syntax
export function addUnitConversions(
  config: any,
  conversions: Array<[UnitConversionKeyArray, UnitConversionFunction]>
): any {
  conversions.forEach(([keyArray, fn]) => {
    const key = arrayToConversionKey(keyArray);
    config.unitConversions.set(key, fn);
  });
  return config;
}
