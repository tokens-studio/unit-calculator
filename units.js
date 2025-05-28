// CSS units supported by the calculator
const CSS_UNITS = [
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
  "pc"
];

class UnitValue {
  constructor(value, unit = null) {
    this.value = value;
    this.unit = unit;
  }

  isUnitless() {
    return this.unit === null;
  }

  isCompatibleWith(other) {
    return (
      (this.isUnitless() && other.isUnitless()) ||
      (this.unit === other.unit && this.unit !== null)
    );
  }

  canMultiplyWith(other) {
    return this.isUnitless() || other.isUnitless() || this.unit === other.unit;
  }

  toString() {
    return this.isUnitless() ? `${this.value}` : `${this.value}${this.unit}`;
  }

  add(other) {
    if (!this.isCompatibleWith(other)) {
      throw new Error(
        `Cannot add incompatible units: ${this.unit ||
          "unitless"} and ${other.unit || "unitless"}`
      );
    }

    return new UnitValue(this.value + other.value, this.unit || other.unit);
  }

  subtract(other) {
    if (!this.isCompatibleWith(other)) {
      throw new Error(
        `Cannot subtract incompatible units: ${this.unit ||
          "unitless"} and ${other.unit || "unitless"}`
      );
    }

    return new UnitValue(this.value - other.value, this.unit || other.unit);
  }

  multiply(other) {
    if (!this.canMultiplyWith(other)) {
      throw new Error(
        `Cannot multiply incompatible units: ${this.unit ||
          "unitless"} and ${other.unit || "unitless"}`
      );
    }

    // If one is unitless, result has the unit of the other
    // If both have the same unit, result has that unit
    // If both are unitless, result is unitless
    const resultUnit = this.isUnitless() ? other.unit : this.unit;
    return new UnitValue(this.value * other.value, resultUnit);
  }

  divide(other) {
    if (!this.canMultiplyWith(other)) {
      throw new Error(
        `Cannot divide incompatible units: ${this.unit ||
          "unitless"} and ${other.unit || "unitless"}`
      );
    }

    // Special case: if units are the same, they cancel out
    if (this.unit === other.unit && this.unit !== null) {
      return new UnitValue(this.value / other.value, null);
    }

    // If denominator is unitless, result has unit of numerator
    // If numerator is unitless, result is unitless (can't have unit in denominator)
    const resultUnit = other.isUnitless() ? this.unit : null;
    return new UnitValue(this.value / other.value, resultUnit);
  }

  negate() {
    return new UnitValue(-this.value, this.unit);
  }
}

// Parse a string into a UnitValue
function parseUnitValue(str) {
  // Match a number followed by optional unit
  const match = str.match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
  if (!match) {
    throw new Error(`Invalid unit value: ${str}`);
  }

  const [, valueStr, unit] = match;
  const value = parseFloat(valueStr);

  if (unit && !CSS_UNITS.includes(unit)) {
    throw new Error(`Unsupported CSS unit: ${unit}`);
  }

  return new UnitValue(value, unit || null);
}

module.exports = {
  UnitValue,
  parseUnitValue,
  CSS_UNITS
};
