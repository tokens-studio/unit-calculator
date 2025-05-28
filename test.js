const _test = require('tape')
const {calc} = require('./parser')

const test = (expr, expected) =>
	_test(expr, t => {
		t.equal(calc(expr), expected)
		t.end()
	})

test('1 + 2 * 3', 7)
test('(1 + 2) * 3', 9)
test('1', 1)
test('((1))', 1)
test('3^4^.5', 9)
test('(2^3)^4', 4096)
test('-2*-2', 4)
test('-2*2', -4)
test('5/2/.5', 5)
test('5 - 3 - 1 - 4', -3)
test('floor(ceil(0.5) / 2)', 0)
test('PI', Math.PI)
test('abs(cos(PI)) + 9', 10)

// Test that expressions with adjacent numbers throw errors
_test('should throw on adjacent numbers', t => {
	t.throws(() => calc('1 2'), Error, 'Adjacent numbers should throw an error')
	t.throws(() => calc('1+1 2+2'), Error, 'Expression with space between numbers should throw')
	t.end()
})

// Test CSS unit calculations
_test('CSS unit calculations', t => {
	// Addition with same units
	t.equal(calc('1px + 2px'), '3px', 'Addition with same units')
	t.equal(calc('1rem + 2rem'), '3rem', 'Addition with same units')
	
	// Subtraction with same units
	t.equal(calc('5px - 2px'), '3px', 'Subtraction with same units')
	
	// Multiplication with unitless
	t.equal(calc('2px * 3'), '6px', 'Multiplication with unitless')
	t.equal(calc('2 * 3px'), '6px', 'Multiplication with unitless (reversed)')
	
	// Division with unitless
	t.equal(calc('6px / 2'), '3px', 'Division with unitless')
	
	// Division with same units (becomes unitless)
	t.equal(calc('6px / 2px'), '3', 'Division with same units becomes unitless')
	
	// Error cases
	t.throws(() => calc('1px + 1rem'), Error, 'Addition with different units should throw')
	t.throws(() => calc('1px * 1rem'), Error, 'Multiplication with different units should throw')
	t.throws(() => calc('1px / 1rem'), Error, 'Division with different units should throw')
	
	t.end()
})
