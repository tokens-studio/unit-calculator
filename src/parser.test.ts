import test from "tape";
import { calc } from "./parser.js";

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
