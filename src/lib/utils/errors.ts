import type { IUnitValue } from "./units.d.js";
import type { Unit } from "../config.js";

// Utilities -------------------------------------------------------------------

const errorTemplate = (msg: string) => `Evaluation Error: ${msg}`;

export const stringifyUnit = (unit: Unit): string =>
  unit === null ? "unitless" : unit;

// Errors ----------------------------------------------------------------------

export class IncompatibleUnitsError extends Error {
  data: {
    values: Array<IUnitValue>;
    operation: string;
  };

  constructor({
    operation,
    left,
    right,
  }: {
    operation: string;
    left: IUnitValue;
    right: IUnitValue;
  }) {
    const error = `Units ${stringifyUnit(left.unit)} & ${stringifyUnit(
      right.unit
    )} are incompatible in expression ${left.value}${
      left.unit || ""
    } ${operation} ${right.value}${right.unit || ""}.`;

    super(errorTemplate(error));
    this.data = {
      values: [left, right],
      operation,
    };
  }
}

export class UnsupportedUnitError extends Error {
  data: {
    unit: string;
    allowedUnits: string[];
  };

  constructor(unit: string, allowedUnits: string[] | Set<string>) {
    const unitsArray = Array.isArray(allowedUnits)
      ? allowedUnits
      : [...allowedUnits];
    const error = `Invalid unit: "${stringifyUnit(
      unit
    )}". Allowed units are: ${unitsArray.map(stringifyUnit).join(", ")}`;

    super(errorTemplate(error));
    this.data = {
      unit,
      allowedUnits: unitsArray,
    };
  }
}
