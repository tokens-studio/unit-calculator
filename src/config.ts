import { CSS_UNITS } from "./units.js";

export interface CalcConfig {
  allowedUnits: Set<string>;
}

export interface CalcOptions {
  allowedUnits?: Set<string> | string[];
}

export const defaultConfig = {
  allowedUnits: new Set(CSS_UNITS),
};

export function createConfig({
  allowedUnits = new Set(CSS_UNITS),
}: CalcConfig): CalcConfig {
  return { allowedUnits: new Set(allowedUnits) };
}
