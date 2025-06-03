import { CSS_UNITS } from "./units.js";

export interface CalcConfig {
  allowedUnits: Set<string>;
}

export interface CalcOptions {
  allowedUnits?: Set<string> | string[];
}

export function createConfig(options: CalcOptions = {}): CalcConfig {
  return {
    allowedUnits:
      options.allowedUnits instanceof Set
        ? options.allowedUnits
        : options.allowedUnits
        ? new Set(options.allowedUnits)
        : new Set(CSS_UNITS),
  };
}
