import { createConfig, addUnitConversions } from "./config.js";

// Base size for rem to px conversion (1rem = 16px)
export const baseSize = 16;

// Create a standard config with px and rem unit conversions
export function createStandardConfig() {
  const config = createConfig({
    allowedUnits: new Set(["px", "rem"]),
  });

  // Add unit conversions for px and rem
  addUnitConversions(config, [
    // px + rem = px
    [
      ["px", "+", "rem"],
      (left, right) => ({
        value: left.value + right.value * baseSize,
        unit: "px",
      }),
    ],
    // rem + px = px
    [
      ["rem", "+", "px"],
      (left, right) => ({
        value: left.value * baseSize + right.value,
        unit: "px",
      }),
    ],
    // px - rem = px
    [
      ["px", "-", "rem"],
      (left, right) => ({
        value: left.value - right.value * baseSize,
        unit: "px",
      }),
    ],
    // rem - px = px
    [
      ["rem", "-", "px"],
      (left, right) => ({
        value: left.value * baseSize - right.value,
        unit: "px",
      }),
    ],
  ]);

  return config;
}
