# Token Value Calculator

This project demonstrates the fundamentals of a Pratt Parser. It's based on this [repository](https://github.com/jrop/pratt-calculator), [this paper](https://tdop.github.io/) by Vaughan Pratt, and also learns from [this article](http://javascript.crockford.com/tdop/tdop.html) and [this article](http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/).

## Concepts

In general, the Pratt Parser solves the following problem: given the string "1 + 2 * 3", does the "2" associate with the "+" or the "&#42;".  It also solves "-" being both a prefix _and_ infix operator, as well as elegantly handling right associativity.

The Pratt Parser is based on three computational units:

```js
parser.expr(rbp)	// The expression parser
token.nud()			// "Null Denotation" (operates on no "left" context)
token.led(left, bp) // "Left Denotation" (operates with "left" context)
```

The `parser.expr(rbp)` function looks like:

```js
function expr(rbp) {
	let left = lexer.next().nud()				// (1)
	while (rbp < lexer.peek().bp) {				// (2)
		const operator = lexer.next()			// (3)
		left = operator.led(left, operator.bp)	// (4)
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

## References


- [Simple but Powerful Pratt Parsing](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html)
- [Pratt Parsing: Introduction and Implementation in TypeScript](https://www.less-bug.com/en/posts/pratt-parsing-introduction-and-implementation-in-typescript/)
- [Pratt parsing, aka top-down precedence parsing, aka precedence climbing](https://eliasdorneles.com/til/posts/pratt-parsing-aka-top-down-precedence-parsing-aka-precedence-climbing/)
- [Pratt parser for a subset of JavaScript](https://leontrolski.github.io/pratt-example.html)
