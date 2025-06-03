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

export class UnitValue {
  value: number;
  unit: string | null;
  fromUnitDivision: boolean;

  constructor(
    value: number,
    unit: string | null = null,
    fromUnitDivision: boolean = false
  ) {
    this.value = value;
    this.unit = unit;
    this.fromUnitDivision = fromUnitDivision;
  }

  isUnitless(): boolean {
    return this.unit === null;
  }

  isCompatibleWith(other: UnitValue): boolean {
    return (
      (this.isUnitless() && other.isUnitless()) ||
      (this.unit === other.unit && this.unit !== null)
    );
  }

  canMultiplyWith(other: UnitValue): boolean {
    return this.isUnitless() || other.isUnitless() || this.unit === other.unit;
  }

  toString(): string {
    return this.isUnitless() ? `${this.value}` : `${this.value}${this.unit}`;
  }

  add(other: UnitValue): UnitValue {
    if (!this.isCompatibleWith(other)) {
      throw new Error(
        `Cannot add incompatible units: ${this.unit || "unitless"} and ${
          other.unit || "unitless"
        }`
      );
    }

    return new UnitValue(this.value + other.value, this.unit || other.unit);
  }

  subtract(other: UnitValue): UnitValue {
    if (!this.isCompatibleWith(other)) {
      throw new Error(
        `Cannot subtract incompatible units: ${this.unit || "unitless"} and ${
          other.unit || "unitless"
        }`
      );
    }

    return new UnitValue(this.value - other.value, this.unit || other.unit);
  }

  multiply(other: UnitValue): UnitValue {
    if (!this.canMultiplyWith(other)) {
      throw new Error(
        `Cannot multiply incompatible units: ${this.unit || "unitless"} and ${
          other.unit || "unitless"
        }`
      );
    }

    // If one is unitless, result has the unit of the other
    // If both have the same unit, result has that unit
    // If both are unitless, result is unitless
    const resultUnit = this.isUnitless() ? other.unit : this.unit;
    return new UnitValue(this.value * other.value, resultUnit);
  }

  divide(other: UnitValue): UnitValue {
    if (!this.canMultiplyWith(other)) {
      throw new Error(
        `Cannot divide incompatible units: ${this.unit || "unitless"} and ${
          other.unit || "unitless"
        }`
      );
    }

    // Special case: if units are the same, they cancel out and mark as from unit division
    if (this.unit === other.unit && this.unit !== null) {
      return new UnitValue(this.value / other.value, null, true);
    }

    // If denominator is unitless, result has unit of numerator
    // If numerator is unitless, result is unitless (can't have unit in denominator)
    const resultUnit = other.isUnitless() ? this.unit : null;
    return new UnitValue(this.value / other.value, resultUnit, false);
  }

  negate(): UnitValue {
    return new UnitValue(-this.value, this.unit, this.fromUnitDivision);
  }
}
