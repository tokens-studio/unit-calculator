import { CalcConfig, defaultConfig, getConversionKey, findBestConversionKey } from "./config.js";

export class UnitValue {
  value: number;
  unit: string | null;
  fromUnitDivision: boolean;
  config: CalcConfig;

  constructor(
    value: number,
    unit: string | null = null,
    fromUnitDivision: boolean = false,
    config: CalcConfig = defaultConfig
  ) {
    this.value = value;
    this.unit = unit;
    this.fromUnitDivision = fromUnitDivision;
    this.config = config;
  }

  static areAllCompatible(values: UnitValue[]): boolean {
    if (values.length <= 1) {
      return true;
    }

    const firstValue = values[0];
    return values.every((value) => firstValue.isCompatibleWith(value));
  }

  isUnitless(): boolean {
    return this.unit === null;
  }


  isCompatibleWith(other: UnitValue): boolean {
    // Same units are always compatible
    if (this.unit === other.unit) {
      return true;
    }

    // Both unitless is compatible
    if (this.isUnitless() && other.isUnitless()) {
      return true;
    }

    // Check if there's a conversion defined for these units
    // Try exact match first, then wildcards
    return !!findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "+",
      other.unit
    );
  }

  canMultiplyWith(other: UnitValue): boolean {
    return this.isUnitless() || other.isUnitless() || this.unit === other.unit;
  }

  toString(): string {
    return this.isUnitless() ? `${this.value}` : `${this.value}${this.unit}`;
  }

  add(other: UnitValue): UnitValue {
    // Same units or one is unitless
    if (this.unit === other.unit || this.isUnitless() || other.isUnitless()) {
      return new UnitValue(
        this.value + other.value,
        this.unit || other.unit,
        false,
        this.config
      );
    }

    // Check for conversion using wildcard matching
    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "+",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, false, this.config);
    }

    throw new Error(
      `Cannot add incompatible units: ${this.unit || "unitless"} and ${
        other.unit || "unitless"
      }`
    );
  }

  subtract(other: UnitValue): UnitValue {
    // Same units or one is unitless
    if (this.unit === other.unit || this.isUnitless() || other.isUnitless()) {
      return new UnitValue(
        this.value - other.value,
        this.unit || other.unit,
        false,
        this.config
      );
    }

    // Check for conversion using wildcard matching
    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "-",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, false, this.config);
    }

    throw new Error(
      `Cannot subtract incompatible units: ${this.unit || "unitless"} and ${
        other.unit || "unitless"
      }`
    );
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
    return new UnitValue(
      this.value * other.value,
      resultUnit,
      false,
      this.config
    );
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
      return new UnitValue(this.value / other.value, null, true, this.config);
    }

    // If denominator is unitless, result has unit of numerator
    // If numerator is unitless, result is unitless (can't have unit in denominator)
    const resultUnit = other.isUnitless() ? this.unit : null;
    return new UnitValue(
      this.value / other.value,
      resultUnit,
      false,
      this.config
    );
  }

  negate(): UnitValue {
    return new UnitValue(
      -this.value,
      this.unit,
      this.fromUnitDivision,
      this.config
    );
  }
}
