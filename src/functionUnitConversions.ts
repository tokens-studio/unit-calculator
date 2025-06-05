export type FunctionUnitConversionKey = string;

export type FunctionUnitConversionFunction = (args: any[]) => {
  value: number;
  unit: string | null;
};

export type FunctionUnitConversionKeyArray = [string, (string | null)[]];

export function getFunctionConversionKey(
  functionName: string,
  units: (string | null)[]
): FunctionUnitConversionKey {
  const unitPart = units.map((unit) => (unit === null ? "" : unit)).join(",");
  return `${functionName},${unitPart}`;
}

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
}

export const defaultFunctionUnitConversions: Map<
  FunctionUnitConversionKey,
  FunctionUnitConversionFunction
> = new Map();

export function addFunctionUnitConversions(
  config: any,
  conversions: Array<
    [FunctionUnitConversionKeyArray, FunctionUnitConversionFunction]
  >
): any {
  conversions.forEach(([keyArray, fn]) => {
    const [functionName, units] = keyArray;
    const key = getFunctionConversionKey(functionName, units);
    config.functionUnitConversions.set(key, fn);
  });
  return config;
}
