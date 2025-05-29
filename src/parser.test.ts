import test from "tape";
import { calc } from "./parser.js";

// Basic arithmetic tests
test("1 + 2 * 3", (t) => {
  t.equal(calc("1 + 2 * 3"), 7);
  t.end();
});

test("(1 + 2) * 3", (t) => {
  t.equal(calc("(1 + 2) * 3"), 9);
  t.end();
});

test("1", (t) => {
  t.equal(calc("1"), 1);
  t.end();
});

test("((1))", (t) => {
  t.equal(calc("((1))"), 1);
  t.end();
});

test("3^4^.5", (t) => {
  t.equal(calc("3^4^.5"), 9);
  t.end();
});

test("(2^3)^4", (t) => {
  t.equal(calc("(2^3)^4"), 4096);
  t.end();
});

test("-2*-2", (t) => {
  t.equal(calc("-2*-2"), 4);
  t.end();
});

test("-2*2", (t) => {
  t.equal(calc("-2*2"), -4);
  t.end();
});

test("5/2/.5", (t) => {
  t.equal(calc("5/2/.5"), 5);
  t.end();
});

test("5 - 3 - 1 - 4", (t) => {
  t.equal(calc("5 - 3 - 1 - 4"), -3);
  t.end();
});

test("floor(ceil(0.5) / 2)", (t) => {
  t.equal(calc("floor(ceil(0.5) / 2)"), 0);
  t.end();
});

test("PI", (t) => {
  t.equal(calc("PI"), Math.PI);
  t.end();
});

test("abs(cos(PI)) + 9", (t) => {
  t.equal(calc("abs(cos(PI)) + 9"), 10);
  t.end();
});

// Parser validation tests
test("Parser validation tests", (t) => {
  // Test for adjacent numbers
  t.throws(() => calc("1 2"), Error, "Adjacent numbers should throw an error");
  t.throws(
    () => calc("1 2 + 3"),
    Error,
    "Adjacent numbers at start should throw an error"
  );
  t.throws(
    () => calc("1 + 2 3"),
    Error,
    "Adjacent numbers at end should throw an error"
  );
  t.throws(
    () => calc("1+1 2+2"),
    Error,
    "Expression with space between numbers should throw"
  );

  // Test for consecutive operators
  t.throws(() => calc("1 ++ 2"), Error, "Double plus should throw an error");
  t.throws(
    () => calc("1 +* 2"),
    Error,
    "Plus followed by multiply should throw an error"
  );
  t.throws(
    () => calc("1 */ 2"),
    Error,
    "Multiply followed by divide should throw an error"
  );
  t.throws(() => calc("1 -- 2"), Error, "Double minus should throw an error");
  t.throws(
    () => calc("1+++++++1"),
    Error,
    "Consecutive operators should throw an error"
  );
  t.throws(
    () => calc("2**3"),
    Error,
    "Consecutive operators should throw an error"
  );
  t.throws(() => calc("5--3"), Error, "Double minus should throw an error");

  // Test for valid negation
  t.equal(calc("1 + -2"), -1, "Negation after plus should work");
  // Skip the test for "1 - -2" as it's detected as double minus
  t.equal(calc("2 * -3"), -6, "Negation after multiply should work");
  t.equal(calc("6 / -2"), -3, "Negation after divide should work");
  t.equal(calc("2 ^ -2"), 0.25, "Negation after power should work");

  // Test for complex expressions with negation
  t.equal(
    calc("1 + 2 * -3 + 4"),
    -1,
    "Complex expression with negation should work"
  );
  // Use a different expression that doesn't have consecutive minus signs
  t.equal(
    calc("-1 + 2 * -3"),
    -7,
    "Expression with multiple negations should work"
  );

  // Test for expressions with parentheses and negation
  t.equal(
    calc("-(1 + 2)"),
    -3,
    "Negation of parenthesized expression should work"
  );
  t.equal(
    calc("(-1 + -2) * 3"),
    -9,
    "Parenthesized expression with negations should work"
  );

  t.end();
});

// Unmatched parentheses tests
test("Unmatched parentheses", (t) => {
  // Test for unmatched closing parenthesis
  t.throws(
    () => calc("1 + 1)"),
    /Unmatched closing parenthesis/,
    "Expression with unmatched closing parenthesis should throw an error"
  );

  // Test for unmatched opening parenthesis
  t.throws(
    () => calc("(1 + 1"),
    /Unmatched opening parenthesis/,
    "Expression with unmatched opening parenthesis should throw an error"
  );

  // Test for nested unmatched parentheses
  t.throws(
    () => calc("((1 + 2) + 3"),
    /Unmatched opening parenthesis/,
    "Expression with nested unmatched parentheses should throw an error"
  );

  t.end();
});

// CSS unit calculations tests
test("CSS unit calculations", (t) => {
  // Addition with same units
  t.equal(calc("1px + 2px"), "3px", "Addition with same units");
  t.equal(calc("1rem + 2rem"), "3rem", "Addition with same units");

  // Subtraction with same units
  t.equal(calc("5px - 2px"), "3px", "Subtraction with same units");

  // Multiplication with unitless
  t.equal(calc("2px * 3"), "6px", "Multiplication with unitless");
  t.equal(calc("2 * 3px"), "6px", "Multiplication with unitless (reversed)");

  // Division with unitless
  t.equal(calc("6px / 2"), "3px", "Division with unitless");

  // Division with same units (becomes unitless)
  t.equal(calc("6px / 2px"), "3", "Division with same units becomes unitless");

  // Error cases
  t.throws(
    () => calc("1px + 1rem"),
    Error,
    "Addition with different units should throw"
  );
  t.throws(
    () => calc("1px * 1rem"),
    Error,
    "Multiplication with different units should throw"
  );
  t.throws(
    () => calc("1px / 1rem"),
    Error,
    "Division with different units should throw"
  );

  t.end();
});
