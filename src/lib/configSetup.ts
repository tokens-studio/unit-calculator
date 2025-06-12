import { createConfig, addUnitConversions } from "./config.js";

// Base size for rem to px conversion (1rem = 16px)
export const baseSize = 16;

export const createPercentConfig = function () {
  const addPercent = (percent: { value: number }, unit: { value: number }) => ({
    value: (unit.value / 100) * percent.value + unit.value,
    unit: "px",
  });

  const config = createConfig();

  return addUnitConversions(config, [
    [["%", "+", "*"], (left, right) => addPercent(left, right)],
    [["*", "+", "%"], (left, right) => addPercent(right, left)],
  ]);
};
