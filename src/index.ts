export { CSS_UNITS } from "./lib/utils/constants.js";

export { calc, run } from "./lib/parser.js";
export * as errors from "./lib/utils/errors.js";
export { UnsupportedUnitError } from "./lib/utils/errors.js";
export * as config from "./lib/config.js";
export type { IUnitValue } from "./lib/utils/units.d.js";
export { UnitValue } from "./lib/units.js";

import { createPenpotConfig } from "./lib/presets/penpot.js";

export const presets = {
  penpot: createPenpotConfig,
};
