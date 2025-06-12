import { createConfig, addUnitConversions } from "../config.js";

export function createPenpotConfig({ baseSize = 16 }: { baseSize: number }) {
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
