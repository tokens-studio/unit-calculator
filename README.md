# Unit Calculator

A tool to run calculations on strings with units.

The unit calculator lets you define custom rules on how mixed units will be resolved.

It will mainly be used to resolve math operations on design token epxressions.

## Example

You can run the repl with a few presets (css units, dimensions, durations, etc)

``` typescript
// Allows defining custom units
> 1h + 1min
[ "61min" ]

// Allows unit mixing defined per custom functions
> 10px + 1rem
[ "26px" ]

// Allows functions
> abs(2px)
[ "2px" ]

// Handles multiple expressions
> (2px * 4) - (2rem * 10) 1rem 2% * 10
[ "-312px", "1rem", "20%" ]
```

## Running it

### In the console

``` sh
bun run cli       # Start a repl
bun run cli "1+1" # Evaluate expression
> 2
```

## Configuration

The configuration for the engine looks like this:

``` typescript
export interface CalcConfig {
  allowedUnits: Set<string>;
  mathFunctions: Record<string, args => number>;
  unitConversions: Map<string, (LeftToken, RightToken) => {value: number; unit: string | null}>;
}
```

## `allowedUnits`

Define which units are allowed in your engine, per default CSS units are allowed.

Right now you can use any string value as unit to be allowed, any non allowed unit will throw.

For instance to allow measure units

``` typescript
{allowedUnits: new Set(["km", "m", "cm", "mm"])}
```

So you can use them in your calculations

```
> 2km + 2km => [ "4km" ]
```

To mix units you have to set your conversion table

```
> 2foo + 2bar
Invalid unit: "foo". Allowed units are: px, em, rem, %, vh, vw, vmin, vmax, cm, mm, in, pt, pc
```

## `unitConversions`

You can define how units convert by passing in a Vector of rules.

These rules will define how the engine will convert units when you mix them.

### Rules

- Mixing the same units will always preserve units.
- Unitless Numbers will be matched with `null`, e.g.: `[null, '+', 'px']`
- You can give a wildcard operator with `*`, e.g.: `['*', '+', '%']`

### Defining a conversion table entry

To define an entry you give it a 3-tuple of `[unit, operator, unit]` and a function that handles the conversion.

For example if you want to convert rems when mixing with px by multiplying rem by a base size you could pass:

``` typescript
["px", "+", "rem"], (left, right) => {value: left.value + (right.value * 16), unit: "px"},
```

So you get this result

``` typescript
> 1px + 1rem
[ "17px" ]
```

### Percent Example

You could define a unit `%` that will always add `x%` to the other value

``` typescript
export const createPercentConfig = function () {
  const addPercent = (percentToken, unitToken) => ({
    value: (unitToken.value / 100) * percentToken.value + unitToken.value,
    unit: unitToken.unit,
  });

  const config = createConfig();

  return addUnitConversions(config, [
    [
      ["%", "+", "*"], (left, right) => addPercent(left, right),
    ],
    [
      ["*", "+", "%"], (left, right) => addPercent(right, left),
    ],
  ]);
};
```

Now you can add percent to any value that you accept

``` typescript
> 100px + 10%
[ "110px" ]
```

## `mathFunctions`

You can supply your own math functions via the `mathFunctions` property.

Per default all functions in js `Math` are included.

You could define custom functions like this

``` typescript
const options = {
    mathFunctions: { add: (a: number, b: number) => a + b },
};
```

Now you can use your custom functions like this

``` typescript
> add(10px, 10px)
[ "20px" ]
```

*Functions dont accept multi unit handling yet!*

## Concepts

This project demonstrates the fundamentals of a Pratt Parser. It's based on this [repository](https://github.com/jrop/pratt-calculator), [this paper](https://tdop.github.io/) by Vaughan Pratt, and also learns from [this article](http://javascript.crockford.com/tdop/tdop.html) and [this article](http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/).

### Parser

In general, the Pratt Parser solves the following problem: given the string "1 + 2 * 3", does the "2" associate with the "+" or the "&#42;".  It also solves "-" being both a prefix _and_ infix operator, as well as elegantly handling right associativity.

The Pratt Parser is based on three computational units:

```js
parser.expr(rbp)    // The expression parser
token.nud()         // "Null Denotation" (operates on no "left" context)
token.led(left, bp) // "Left Denotation" (operates with "left" context)
```

The `parser.expr(rbp)` function looks like:

```js
function expr(rbp) {
  let left = lexer.next().nud()               // (1)
  while (rbp < lexer.peek().bp) {             // (2)
    const operator = lexer.next()           // (3)
    left = operator.led(left, operator.bp)  // (4)
  }
  return left
}
```

Of course, `nud` and `led` may recursively call `expr`.

The `expr` method can be summarized in english as "The loop (while) builds out the tree to the left, while recursion (led -> expr) builds the tree out to the right; nud handles prefix operators":

```js
function expr(rbp) {
  // (1) handle prefix operator
  // (2) continue until I encounter an operator of lesser precedence than myself
  // (3) "eat" the operator
  // (4) give the operator the left side of the tree, and let it build the right side; this new tree is our new "left"
}
```

#### References

- [Simple but Powerful Pratt Parsing](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html)
- [Pratt Parsing: Introduction and Implementation in TypeScript](https://www.less-bug.com/en/posts/pratt-parsing-introduction-and-implementation-in-typescript/)
- [Pratt parsing, aka top-down precedence parsing, aka precedence climbing](https://eliasdorneles.com/til/posts/pratt-parsing-aka-top-down-precedence-parsing-aka-precedence-climbing/)
- [Pratt parser for a subset of JavaScript](https://leontrolski.github.io/pratt-example.html)
