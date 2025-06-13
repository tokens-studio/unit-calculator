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

export const createPercentConfig = function (
  config = createConfig()
): CalcConfig {
  return addUnitConversions(config, [
    [["%", "+", "*"], (left, right) => addPercent(left, right)],
    [["*", "+", "%"], (left, right) => addPercent(right, left)],
  ]);
};
