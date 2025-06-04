import type { IUnitValue } from "./units.d.js";

const evaluationError = (msg) => `Evaluation Error: ${msg}`;

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
    const error = `Units ${left.unit || "unitless"} & ${
      right.unit || "unitless"
    } are incompatible in expression ${left.value}${left.unit} ${operation} ${
      right.value
    }${right.unit}.`;

    super(evaluationError(error));
    this.values = [left, right];
  }
}
