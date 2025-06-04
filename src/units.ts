import type { CalcConfig } from "./config.js";
import {
  defaultConfig,
  getConversionKey,
  findBestConversionKey,
} from "./config.js";
import { IncompatibleUnitsError } from "./utils/errors.js";
import type { IUnitValue, UnitValueConstructor } from "./utils/units.d.js";

export class UnitValue implements IUnitValue {
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

  static areAllCompatible(values: IUnitValue[]): boolean {
    if (values.length <= 1) {
      return true;
    }

    const firstValue = values[0];
    return values.every((value) => firstValue.isCompatibleWith(value));
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
      return new UnitValue(
        this.value + other.value,
        this.unit,
        false,
        this.config
      );
    }

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

    throw new IncompatibleUnitsError({
      operation: "+",
      left: this,
      right: other,
    });
  }

  subtract(other: IUnitValue): IUnitValue {
    // Same units
    if (this.unit === other.unit) {
      return new UnitValue(
        this.value - other.value,
        this.unit,
        false,
        this.config
      );
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
        return new UnitValue(result.value, result.unit, false, this.config);
      }

      // Default behavior for unitless - unit
      return new UnitValue(
        this.value - other.value,
        other.unit,
        false,
        this.config
      );
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
        return new UnitValue(result.value, result.unit, false, this.config);
      }

      // Default behavior for unit - unitless
      return new UnitValue(
        this.value - other.value,
        this.unit,
        false,
        this.config
      );
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
      return new UnitValue(result.value, result.unit, false, this.config);
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
      return new UnitValue(
        this.value * other.value,
        this.unit,
        false,
        this.config
      );
    }

    // If one is unitless, result has the unit of the other
    if (this.isUnitless()) {
      return new UnitValue(
        this.value * other.value,
        other.unit,
        false,
        this.config
      );
    }

    if (other.isUnitless()) {
      return new UnitValue(
        this.value * other.value,
        this.unit,
        false,
        this.config
      );
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
      return new UnitValue(result.value, result.unit, false, this.config);
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
      // Mark as from unit division if units were the same
      const fromUnitDivision = this.unit === other.unit && this.unit !== null;
      return new UnitValue(
        result.value,
        result.unit,
        fromUnitDivision,
        this.config
      );
    }

    throw new IncompatibleUnitsError({
      operation: "/",
      left: this,
      right: other,
    });
  }

  negate(): IUnitValue {
    return new UnitValue(
      -this.value,
      this.unit,
      this.fromUnitDivision,
      this.config
    );
  }
}
