import { CSS_UNITS } from "./units.js";

export interface CalcConfig {
  allowedUnits: Set<string>;
}

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
};

export function createConfig(options: Partial<CalcConfig> = {}): CalcConfig {
  let allowedUnits: Set<string>;
  
  if (options.allowedUnits instanceof Set) {
    allowedUnits = options.allowedUnits;
  } else if (options.allowedUnits) {
    allowedUnits = new Set(options.allowedUnits);
  } else {
    allowedUnits = new Set(CSS_UNITS);
  }
  
  return { allowedUnits };
}
