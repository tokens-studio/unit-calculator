// Dimension units table generator
// This file provides utilities to generate conversion tables for dimension units

export interface UnitConversionTable {
  // Maps from source unit to target unit with conversion factor
  [sourceUnit: string]: {
    [targetUnit: string]: number;
  };
}

/**
 * Creates a conversion table for a set of dimension units
 * @param units Array of units in order from largest to smallest
 * @param conversionFactors Array of conversion factors between adjacent units
 * @returns A complete conversion table between all units
 */
export function createDimensionTable(
  units: string[],
  conversionFactors: number[]
): UnitConversionTable {
  if (units.length - 1 !== conversionFactors.length) {
    throw new Error(
      "Number of conversion factors must be one less than number of units"
    );
  }

  const table: UnitConversionTable = {};

  // Initialize table with empty objects for each unit
  units.forEach((unit) => {
    table[unit] = {};
  });

  // Fill in direct conversions (adjacent units)
  for (let i = 0; i < conversionFactors.length; i++) {
    const sourceUnit = units[i];
    const targetUnit = units[i + 1];
    const factor = conversionFactors[i];

    // sourceUnit to targetUnit (e.g., km to m: multiply by 1000)
    table[sourceUnit][targetUnit] = factor;

    // targetUnit to sourceUnit (e.g., m to km: divide by 1000)
    table[targetUnit][sourceUnit] = 1 / factor;
  }

  // Fill in indirect conversions (non-adjacent units)
  for (let i = 0; i < units.length; i++) {
    const sourceUnit = units[i];

    for (let j = 0; j < units.length; j++) {
      const targetUnit = units[j];

      // Skip if it's the same unit or if conversion is already defined
      if (i === j || table[sourceUnit][targetUnit] !== undefined) {
        continue;
      }

      // Calculate conversion through intermediate units
      let factor = 1;
      let currentUnit = sourceUnit;

      // If source comes before target in the array, move forward
      if (i < j) {
        for (let k = i; k < j; k++) {
          factor *= table[currentUnit][units[k + 1]];
          currentUnit = units[k + 1];
        }
      }
      // If source comes after target in the array, move backward
      else {
        for (let k = i; k > j; k--) {
          factor *= table[currentUnit][units[k - 1]];
          currentUnit = units[k - 1];
        }
      }

      table[sourceUnit][targetUnit] = factor;
    }
  }

  return table;
}

// Common dimension tables
export const lengthUnits = ["km", "m", "cm", "mm"];
export const lengthFactors = [1000, 100, 10]; // km->m->cm->mm

export const lengthTable = createDimensionTable(lengthUnits, lengthFactors);

// Time units
export const timeUnits = ["h", "min", "s", "ms"];
export const timeFactors = [60, 60, 1000]; // h->min->s->ms

export const timeTable = createDimensionTable(timeUnits, timeFactors);

// Weight units
export const weightUnits = ["kg", "g", "mg"];
export const weightFactors = [1000, 1000]; // kg->g->mg

export const weightTable = createDimensionTable(weightUnits, weightFactors);

/**
 * Generates unit conversion functions from a dimension table
 * @param table The unit conversion table
 * @param operator The operator for which to generate conversions (e.g., '+', '-')
 * @returns Array of conversion entries ready for addUnitConversions
 */
export function generateConversionsFromTable(
  table: UnitConversionTable,
  operator: string
): Array<
  [
    Array<string | null>,
    (left: any, right: any) => { value: number; unit: string | null }
  ]
> {
  const conversions: Array<
    [
      Array<string | null>,
      (left: any, right: any) => { value: number; unit: string | null }
    ]
  > = [];

  // For each source unit
  Object.keys(table).forEach((sourceUnit) => {
    // For each target unit
    Object.keys(table[sourceUnit]).forEach((targetUnit) => {
      // Get the conversion factor from target to source
      // This is the factor we need to convert right operand to left's unit
      const factor = table[targetUnit][sourceUnit];

      // Determine which unit is "smaller" (has larger conversion factor)
      // In dimension tables, the smaller unit has a larger number when converting
      // e.g., 1km = 1000m, so m is the smaller unit
      const sourceToTargetFactor = table[sourceUnit][targetUnit];
      const targetToSourceFactor = factor;
      const targetIsSmaller = sourceToTargetFactor > 1;

      // Add conversion from source to target
      if (operator === "+" || operator === "-") {
        conversions.push([
          [sourceUnit, operator, targetUnit],
          (left, right) => {
            if (targetIsSmaller) {
              // Convert left to target's unit (the smaller one)
              const convertedLeft = left.value * sourceToTargetFactor;
              return {
                value:
                  operator === "+"
                    ? convertedLeft + right.value
                    : convertedLeft - right.value,
                unit: targetUnit,
              };
            } else {
              // Convert right to source's unit (the smaller one)
              const convertedRight = right.value * targetToSourceFactor;
              return {
                value:
                  operator === "+"
                    ? left.value + convertedRight
                    : left.value - convertedRight,
                unit: sourceUnit,
              };
            }
          },
        ]);
      }
    });
  });

  return conversions;
}
