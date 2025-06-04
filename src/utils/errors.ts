import type { Units } from "./units.d.js";

export class IncompatibleUnitsError extends Error {
  units: Units;

  constructor({ units }: { units: Units }) {
    super("Mixed units found in expression");
    this.name = "MixedUnitsExpressionError";
    this.units = units;
  }
}
