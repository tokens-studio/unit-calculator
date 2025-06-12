import type { IUnitValue } from "./units.d.js";

const evaluationError = (msg: string) => `Evaluation Error: ${msg}`;

/**
 * Converts a unit value to a string representation for error messages
 * @param unit The unit string or null
 * @returns A string representation of the unit ("unitless" if null)
 */
export function stringifyUnit(unit: string | null): string {
  return unit || "unitless";
}

export class IncompatibleUnitsError extends Error {
  values: Array<IUnitValue>;

  constructor({
    operation,
    left,
    right,
  }: {
    operation: string;
    left: IUnitValue;
    right: IUnitValue;
  }) {
    const error = `Units ${stringifyUnit(left.unit)} & ${
      stringifyUnit(right.unit)
    } are incompatible in expression ${left.value}${left.unit || ""} ${operation} ${
      right.value
    }${right.unit || ""}.`;

    super(evaluationError(error));
    this.values = [left, right];
  }
}

export class UnsupportedUnitError extends Error {
  unit: string;
  allowedUnits: string[];

  constructor(unit: string, allowedUnits: string[] | Set<string>) {
    const unitsArray = Array.isArray(allowedUnits)
      ? allowedUnits
      : [...allowedUnits];
    const error = `Invalid unit: "${stringifyUnit(unit)}". Allowed units are: ${unitsArray.join(
      ", "
    )}`;
    super(error);
    this.unit = unit;
    this.allowedUnits = unitsArray;
  }
}
