import type { CalcConfig } from "../config.js";

export interface IUnitValue {
  value: number;
  unit: string | null;
  config: CalcConfig;

  isUnitless(): boolean;
  toString(): string;

  add(other: IUnitValue): IUnitValue;
  subtract(other: IUnitValue): IUnitValue;
  multiply(other: IUnitValue): IUnitValue;
  divide(other: IUnitValue): IUnitValue;
  negate(): IUnitValue;
}

export interface UnitValueConstructor {
  new (value: number, unit: string | null, config: CalcConfig): IUnitValue;

  areAllCompatible(values: IUnitValue[]): boolean;
}
