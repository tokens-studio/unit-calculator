const createLexer = require('./lexer')
const { UnitValue, parseUnitValue } = require('./units')

function parser(s) {
	// Check for adjacent numbers in the input by looking for patterns like "number whitespace number"
	const adjacentNumbersRegex = /\d+\s+\d+/;
	if (adjacentNumbersRegex.test(s)) {
		throw new Error("Adjacent numbers are not allowed");
	}
	
	const lexer = createLexer(s)
	const BPS = {
		[null]: 0,
		NUMBER: 0,
		ID: 0,
		')': 0,
		'+': 20,
		'-': 20,
		'*': 30,
		'/': 30,
		'^': 40,
		'(': 50,
	}
	const NUDS = {
		NUMBER_WITH_UNIT: t => parseUnitValue(t.match),
		NUMBER: t => new UnitValue(parseFloat(t.match)),
		ID: t => {
			const mbr = Math[t.match]
			if (typeof mbr == 'undefined') {
				const pos = t.strpos().start
				throw new Error(
					`Undefined variable: '${t.match}' (at ${pos.line}:${pos.column})`
				)
			}
			return {type: 'id', ref: mbr, id: t.match}
		},
		'+': (t, bp) => parse(bp),
		'-': (t, bp) => ({type: 'neg', value: parse(bp)}),
		'(': () => {
			const inner = parse()
			lexer.expect(')')
			return inner
		},
	}
	const LEDS = {
		'+': (left, t, bp) => ({type: '+', left, right: parse(bp)}),
		'-': (left, t, bp) => ({type: '-', left, right: parse(bp)}),
		'*': (left, t, bp) => ({type: '*', left, right: parse(bp)}),
		'/': (left, t, bp) => ({type: '/', left, right: parse(bp)}),
		'^': (left, t, bp) => ({
			type: '^',
			left,
			right: parse(bp - 1),
		}),
		'(': left => {
			if (left.type != 'id') {
				throw new Error(`Cannot invoke expression as if it was a function)`)
			}
			if (typeof left.ref != 'function') {
				throw new Error(`Cannot invoke non-function`)
			}

			const args = parse()
			lexer.expect(')')
			return {type: '()', target: left, args}
		},
	}
	function bp(token) {
		return BPS[token.type] || 0
	}
	function nud(token) {
		if (!NUDS[token.type])
			throw new Error(
				`NUD not defined for token type: ${JSON.stringify(token.type)}`
			)
		return NUDS[token.type](token, bp(token))
	}
	function led(left, token) {
		if (!LEDS[token.type])
			throw new Error(
				`LED not defined for token type: ${JSON.stringify(token.type)}`
			)
		return LEDS[token.type](left, token, bp(token))
	}
	function parse(rbp = 0) {
		let left = nud(lexer.next())
		while (bp(lexer.peek()) > rbp) {
			left = led(left, lexer.next())
		}
		return left
	}
	return parse
} // parser

parser.visit = function visit(node) {
	if (typeof node == 'number') return new UnitValue(node);
	if (node instanceof UnitValue) return node;
	
	return {
		id: n => n.ref,
		'^': n => {
			const left = visit(n.left);
			const right = visit(n.right);
			
			// Only allow power operations on unitless values
			if (!left.isUnitless() || !right.isUnitless()) {
				throw new Error("Power operations can only be performed on unitless values");
			}
			
			return new UnitValue(Math.pow(left.value, right.value));
		},
		'+': n => {
			const left = visit(n.left);
			const right = visit(n.right);
			return left.add(right);
		},
		'-': n => {
			const left = visit(n.left);
			const right = visit(n.right);
			return left.subtract(right);
		},
		'*': n => {
			const left = visit(n.left);
			const right = visit(n.right);
			return left.multiply(right);
		},
		'/': n => {
			const left = visit(n.left);
			const right = visit(n.right);
			return left.divide(right);
		},
		'()': node => {
			const args = visit(node.args);
			// Math functions should only operate on the numeric value
			if (node.target.id === 'floor' || node.target.id === 'ceil' || 
				node.target.id === 'abs' || node.target.id === 'cos') {
				return new UnitValue(node.target.ref(args.value), args.unit);
			}
			// For constants like PI, we need to return a UnitValue
			if (typeof node.target.ref === 'number') {
				return new UnitValue(node.target.ref);
			}
			// For other functions, ensure we're passing the value, not the UnitValue object
			return new UnitValue(node.target.ref(args.value));
		},
		neg: n => {
			const value = visit(n.value);
			return value.negate();
		},
	}[node.type](node)
}

parser.calc = function calc(s) {
	const parse = parser(s)
	const result = parser.visit(parse());
	// Return number for unitless values, string for values with units
	return result.isUnitless() ? result.value : result.toString();
}

module.exports = parser
