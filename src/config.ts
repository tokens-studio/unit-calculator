import { CSS_UNITS } from "./units.js";

export interface CalcConfig {
  allowedUnits: Set<string>;
}

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
};

export function createConfig({
  allowedUnits = defaultConfig.allowedUnits,
}: Partial<CalcConfig> = {}): CalcConfig {
  return { allowedUnits: new Set(allowedUnits) };
}
