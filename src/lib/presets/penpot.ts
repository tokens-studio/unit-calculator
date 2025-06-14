import type { CalcConfig } from "../config.js";
import { createConfig, addUnitConversions } from "../config.js";
import { createPercentConfig } from "./percent.js";

export const baseConfig = {
  allowedUnits: new Set(["px", "rem", "%"]),
  allowStrings: false,
  allowMultipleExpressions: false,
};

export const createPenpotConfig = ({
  baseSize = 16,
  config = createConfig(baseConfig),
}: Partial<{
  baseSize: number;
  config: CalcConfig;
}> = {}): CalcConfig => {
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

  const configWithPercent = createPercentConfig({ config: defaultConfig });

  return configWithPercent;
};
