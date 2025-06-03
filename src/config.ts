export const CSS_UNITS = [
  "px",
  "em",
  "rem",
  "%",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
];

export interface CalcConfig {
  allowedUnits: Set<string>;
  mathFunctions: Record<string, (...args: number[]) => number>;
}

export const defaultMathFunctions: Record<
  string,
  (...args: number[]) => number
> = {
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  log: Math.log,
  exp: Math.exp,
  pow: Math.pow,
  max: Math.max,
  min: Math.min,
};

export const defaultConfig: CalcConfig = {
  allowedUnits: new Set(CSS_UNITS),
  mathFunctions: defaultMathFunctions,
};

export function createConfig({
  allowedUnits = defaultConfig.allowedUnits,
  mathFunctions = defaultConfig.mathFunctions,
}: Partial<CalcConfig> = {}): CalcConfig {
  return {
    allowedUnits: new Set(allowedUnits),
    mathFunctions,
  };
}
