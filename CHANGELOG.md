# Changelog

## 0.0.5 (2025-06-13)

- Create percent preset for percentage calculations
  - Support for adding, subtracting, multiplying, and dividing with percentages
  - Percentage operations work with any unit (px, rem, em, etc.)
  - Export percent preset in main index for easy access
- Enhance Penpot preset with percentage support
  - Integrate percent preset into Penpot configuration
  - Maintain existing px/rem conversions while adding percentage operations

## 0.0.4 (2025-06-12)

- Add configuration option to disable strings or groups
- Add CLI arguments to configure REPL and expression parsing options
  - Support for `--strings`/`--no-strings` to control string handling
  - Support for `--multiple-expressions`/`--no-multiple-expressions` to control multiple expression parsing
  - Support for `--units` to specify allowed units
  - Enhanced REPL with configuration display
  - Improved CLI help documentation

## 0.0.3 (2025-06-12)

- Adds penpot preset
- Improve errors
- Reuse types

## 0.0.2 (2025-06-11)

- Refactors and cleanup
