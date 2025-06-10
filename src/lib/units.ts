import type { CalcConfig } from "./config.js";
import { defaultConfig, findBestConversionKey } from "./config.js";
import { IncompatibleUnitsError } from "./utils/errors.js";
import type { IUnitValue } from "./utils/units.d.js";

export class UnitValue implements IUnitValue {
  type: string = "unitvalue";
  value: number;
  unit: string | null;
  config: CalcConfig;

  constructor(
    value: number,
    unit: string | null = null,
    config: CalcConfig = defaultConfig
  ) {
    this.value = value;
    this.unit = unit;
    this.config = config;
  }

  static areAllSame(values: IUnitValue[]): boolean {
    if (values.length === 0) {
      return true;
    }

    const firstValue = values[0];
    return values.every(({ unit }) => firstValue.unit === unit);
  }

  isUnitless(): boolean {
    return this.unit === null;
  }

  isCompatibleWith(other: IUnitValue): boolean {
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

  canMultiplyWith(other: IUnitValue): boolean {
    // Check if there's a conversion defined for these units
    return !!findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "*",
      other.unit
    );
  }

  toString(): string {
    return this.isUnitless() ? `${this.value}` : `${this.value}${this.unit}`;
  }

  add(other: IUnitValue): IUnitValue {
    if (this.unit === other.unit) {
      return new UnitValue(this.value + other.value, this.unit, this.config);
    }

    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "+",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, this.config);
    }

    throw new IncompatibleUnitsError({
      operation: "+",
      left: this,
      right: other,
    });
  }

  subtract(other: IUnitValue): IUnitValue {
    // Same units
    if (this.unit === other.unit) {
      return new UnitValue(this.value - other.value, this.unit, this.config);
    }

    // One is unitless
    if (this.isUnitless()) {
      // Check for conversion first
      const conversion = findBestConversionKey(
        this.config.unitConversions,
        this.unit,
        "-",
        other.unit
      );

      if (conversion) {
        const result = conversion(this, other);
        return new UnitValue(result.value, result.unit, this.config);
      }

      // Default behavior for unitless - unit
      return new UnitValue(this.value - other.value, other.unit, this.config);
    }

    if (other.isUnitless()) {
      // Check for conversion first
      const conversion = findBestConversionKey(
        this.config.unitConversions,
        this.unit,
        "-",
        other.unit
      );

      if (conversion) {
        const result = conversion(this, other);
        return new UnitValue(result.value, result.unit, this.config);
      }

      // Default behavior for unit - unitless
      return new UnitValue(this.value - other.value, this.unit, this.config);
    }

    // Different units - check for conversion
    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "-",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, this.config);
    }

    throw new IncompatibleUnitsError({
      operation: "-",
      left: this,
      right: other,
    });
  }

  multiply(other: IUnitValue): IUnitValue {
    // If both have the same unit
    if (this.unit === other.unit) {
      return new UnitValue(this.value * other.value, this.unit, this.config);
    }

    // If one is unitless, result has the unit of the other
    if (this.isUnitless()) {
      return new UnitValue(this.value * other.value, other.unit, this.config);
    }

    if (other.isUnitless()) {
      return new UnitValue(this.value * other.value, this.unit, this.config);
    }

    // Check for conversion using wildcard matching
    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "*",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, this.config);
    }

    throw new IncompatibleUnitsError({
      operation: "*",
      left: this,
      right: other,
    });
  }

  divide(other: IUnitValue): IUnitValue {
    // Check for conversion using wildcard matching
    const conversion = findBestConversionKey(
      this.config.unitConversions,
      this.unit,
      "/",
      other.unit
    );

    if (conversion) {
      const result = conversion(this, other);
      return new UnitValue(result.value, result.unit, this.config);
    }

    throw new IncompatibleUnitsError({
      operation: "/",
      left: this,
      right: other,
    });
  }

  negate(): IUnitValue {
    return new UnitValue(-this.value, this.unit, this.config);
  }
}
