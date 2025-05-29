- Run tests via `bun run test`
- When implementing or fixing implementations in the code, dont just add a regexp on top
  This is a parser, so it should be fixed in the parser, not just by throwing a regexp on top!

## Rules

- This is a simple math expression calculator to be used with design token values
- It should allow `+`, `-`, `/` and `*` operations between operands
- It should allow functions like `abs(0.5)`
- It should allow css units and calculating on values with units
  - It should allow evaluating on expressions with units like `2em + 2em = 4em`
  - It should not allow mixing of units like `1rem + 1px`
  - You can multiply and divide with regular numbers though like `1rem * 2 = 2rem`
