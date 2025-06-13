export { CSS_UNITS } from "./lib/utils/constants.js";

// Types -----------------------------------------------------------------------

export type { IUnitValue } from "./lib/utils/units.d.js";

export type {
  CalcConfig,
  AllowedUnits,
  ConversionOutput,
  UnitConversionFunction,
  UnitConversionKey,
  UnitConversionKeyArray,
  Unit,
} from "./lib/config.d.js";

// Classes ---------------------------------------------------------------------

export { UnitValue } from "./lib/units.js";

// Errors ----------------------------------------------------------------------

export * as errors from "./lib/utils/errors.js";

// Config ----------------------------------------------------------------------

export * as config from "./lib/config.js";

import { createPenpotConfig } from "./lib/presets/penpot.js";
import { createPercentConfig } from "./lib/presets/percent.js";

export const presets = {
  penpot: createPenpotConfig,
  percent: createPercentConfig,
};

// Main ------------------------------------------------------------------------

export { calc, run } from "./lib/parser.js";
