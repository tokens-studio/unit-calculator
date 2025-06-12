// Unit type definition
export type Unit = string | null;

export type AllowedUnits = Set<string>;

export interface ConversionOutput {
  value: number;
  unit: Unit;
}

export type UnitConversionKey = string;

export type UnitConversionFunction = (
  left: any,
  right: any
) => ConversionOutput;

export interface CalcConfig {
  allowedUnits: AllowedUnits;
  mathFunctions: Record<string, (...args: any[]) => ConversionOutput>;
  mathConstants: Record<string, number>;
  unitConversions: Map<UnitConversionKey, UnitConversionFunction>;
}

// Types for the array-based conversion key format
export type UnitConversionKeyArray = [Unit, string, Unit];
