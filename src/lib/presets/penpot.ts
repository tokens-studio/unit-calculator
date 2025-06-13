import type { CalcConfig } from "../config.js";
import { createConfig, addUnitConversions } from "../config.js";
import { createPercentConfig } from "./percent.js";

const allowedUnits = new Set(["px", "rem", "%"]);

export function createPenpotConfig({
  baseSize = 16,
  config = createConfig({ allowedUnits }),
}: {
  baseSize: number;
  config: CalcConfig;
}) {
  const defaultConfig = addUnitConversions(config, [
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

  const configWithPercent = createPercentConfig(defaultConfig);

  return configWithPercent;
}
