import { createConfig, addUnitConversions, CSS_UNITS } from "./config.js";

export const createPercentConfig = function () {
  const addPercent = (percent, unit) => ({
    value: (unit.value / 100) * percent.value + unit.value,
    unit: "px",
  });

  const config = createConfig();

  // prettier-ignore
  return addUnitConversions(config, [
    [
      ["%", "+", "*"], (left, right) => addPercent(left, right),
    ],
    [
      ["*", "+", "%"], (left, right) => addPercent(right, left),
    ],
  ]);

  return config;
};

export function createPenpotConfig(baseSize = 16) {
  export const baseSize = 16;

  const config = createConfig({
    allowedUnits: new Set(["px", "rem"]),
  });

  addUnitConversions(config, [
    [
      ["px", "+", "rem"],
      (left, right) => ({
        value: left.value + right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "+", "px"],
      (left, right) => ({
        value: left.value * baseSize + right.value,
        unit: "px",
      }),
    ],
    [
      ["px", "-", "rem"],
      (left, right) => ({
        value: left.value - right.value * baseSize,
        unit: "px",
      }),
    ],
    [
      ["rem", "-", "px"],
      (left, right) => ({
        value: left.value * baseSize - right.value,
        unit: "px",
      }),
    ],
    [
      ["px", "+", ""],
      (left, right) => ({
        value: left.value + right.value,
        unit: "px",
      }),
    ],
    [
      ["", "+", "px"],
      (left, right) => ({
        value: left.value + right.value,
        unit: "px",
      }),
    ],
  ]);

  return config;
}
