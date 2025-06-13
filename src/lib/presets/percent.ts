import type { CalcConfig, UnitConversionFunction } from "../config.d.js";
import type { IUnitValue } from "../utils/units.js";
import { createConfig, addUnitConversions } from "../config.js";

export const addPercent: UnitConversionFunction = (
  percentToken,
  unitToken
) => ({
  value: (unitToken.value / 100) * percentToken.value + unitToken.value,
  unit: unitToken.unit,
});

export const subtractPercent: UnitConversionFunction = (
  percentToken,
  unitToken
) => ({
  value: unitToken.value - (unitToken.value / 100) * percentToken.value,
  unit: unitToken.unit,
});

export const subtractValueFromPercent: UnitConversionFunction = (
  percentToken,
  unitToken
) => ({
  value: -(unitToken.value - (unitToken.value / 100) * percentToken.value),
  unit: unitToken.unit,
});

export const multiplyPercent: UnitConversionFunction = (
  percentToken,
  unitToken
) => ({
  value: (unitToken.value / 100) * percentToken.value,
  unit: unitToken.unit,
});

export const divideByPercent: UnitConversionFunction = (
  unitToken,
  percentToken
) => ({
  value: (unitToken.value * 100) / percentToken.value,
  unit: unitToken.unit,
});

export const dividePercentBy: UnitConversionFunction = (
  percentToken,
  unitToken
) => ({
  value: percentToken.value / unitToken.value,
  unit: "%",
});

export const createPercentConfig = function ({
  config = createConfig(),
}: Partial<{
  config: CalcConfig;
}> = {}): CalcConfig {
  return addUnitConversions(config, [
    // Addition
    [["%", "+", "*"], (left, right) => addPercent(left, right)],
    [["*", "+", "%"], (left, right) => addPercent(right, left)],

    // Subtraction
    [["%", "-", "*"], (left, right) => subtractValueFromPercent(left, right)],
    [["*", "-", "%"], (left, right) => subtractPercent(right, left)],

    // Multiplication
    [["%", "*", "*"], (left, right) => multiplyPercent(left, right)],
    [["*", "*", "%"], (left, right) => multiplyPercent(right, left)],

    // Division
    [["*", "/", "%"], (left, right) => divideByPercent(left, right)],
    [["%", "/", "*"], (left, right) => dividePercentBy(left, right)],
  ]);
};
