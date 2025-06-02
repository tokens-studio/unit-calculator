import createLexer, { Lexer, Token } from "./lexer.js";
import { UnitValue, parseUnitValue } from "./units.js";

type NodeType = "id" | "+" | "-" | "*" | "/" | "^" | "()" | "neg";

interface BaseNode {
  type: NodeType;
}

interface IdNode extends BaseNode {
  type: "id";
  ref: number | Function;
  id: string;
}

interface BinaryOpNode extends BaseNode {
  type: "+" | "-" | "*" | "/" | "^";
  left: ASTNode;
  right: ASTNode;
}

interface FunctionCallNode extends BaseNode {
  type: "()";
  target: IdNode;
  args: ASTNode;
}

interface NegationNode extends BaseNode {
  type: "neg";
  value: ASTNode;
}

type ASTNode =
  | IdNode
  | BinaryOpNode
  | FunctionCallNode
  | NegationNode
  | UnitValue
  | number;

interface BindingPowers {
  [key: string]: number;
}

interface NudFunction {
  (
    token: Token,
    bp: number,
    parse: (rbp?: number) => ASTNode,
    lexer: Lexer
  ): ASTNode;
}

interface LedFunction {
  (
    left: ASTNode,
    token: Token,
    bp: number,
    parse: (rbp?: number) => ASTNode,
    lexer: Lexer
  ): ASTNode;
}

interface NudFunctions {
  [key: string]: NudFunction;
}

interface LedFunctions {
  [key: string]: LedFunction;
}

// BPS - binding powers of operators
const BPS: BindingPowers = {
  [null as unknown as string]: 0,
  NUMBER: 0,
  ID: 0,
  ")": 0,
  "+": 20,
  "-": 20,
  "*": 30,
  "/": 30,
  "^": 40,
  "(": 50,
};

// NUDS - null denotation - tokens that start expressions
const NUDS: NudFunctions = {
  NUMBER_WITH_UNIT: (t, _bp, _parse, _lexer) => parseUnitValue(t.match!),
  NUMBER: (t, _bp, _parse, _lexer) => new UnitValue(parseFloat(t.match!)),
  ID: (t, _bp, _parse, _lexer) => {
    const mbr = Math[t.match! as keyof typeof Math];
    if (typeof mbr == "undefined") {
      // Get the input string position from the token
      let posInfo = "";
      try {
        if (t.strpos) {
          const pos = t.strpos();
          if (
            pos &&
            pos.start &&
            typeof pos.start.line === "number" &&
            typeof pos.start.column === "number"
          ) {
            posInfo = `at line ${pos.start.line}, column ${pos.start.column}`;
          }
        }
      } catch (e) {
        // If there's any error getting position, we'll use a generic message
      }

      throw new Error(
        `Unknown expression: '${t.match}'${
          posInfo ? " " + posInfo : ""
        }. Only Math constants and functions are supported.`
      );
    }
    return { type: "id", ref: mbr, id: t.match! } as IdNode;
  },
  "+": (_t, bp, parse, _lexer) => parse(bp),
  "-": (_t, bp, parse, _lexer) =>
    ({ type: "neg", value: parse(bp) } as NegationNode),
  "(": (_t, _bp, parse, lexer) => {
    const inner = parse();
    lexer.expect(")");
    return inner;
  },
};

// LEDS - left denotation - tokens that continue expressions)
const LEDS: LedFunctions = {
  "+": (left, _t, bp, parse) =>
    ({ type: "+", left, right: parse(bp) } as BinaryOpNode),
  "-": (left, _t, bp, parse) =>
    ({ type: "-", left, right: parse(bp) } as BinaryOpNode),
  "*": (left, _t, bp, parse) =>
    ({ type: "*", left, right: parse(bp) } as BinaryOpNode),
  "/": (left, _t, bp, parse) =>
    ({ type: "/", left, right: parse(bp) } as BinaryOpNode),
  "^": (left, _t, bp, parse) =>
    ({
      type: "^",
      left,
      right: parse(bp - 1),
    } as BinaryOpNode),
  "(": (left, _t, _bp, parse, lexer) => {
    if ((left as IdNode).type != "id") {
      throw new Error(`Cannot invoke expression as if it was a function`);
    }
    const idNode = left as IdNode;
    if (typeof idNode.ref != "function") {
      throw new Error(`Cannot invoke non-function`);
    }

    const args = parse();
    lexer.expect(")");
    return { type: "()", target: idNode, args } as FunctionCallNode;
  },
};

function getBp(token: Token): number {
  return BPS[token.type as keyof typeof BPS] || 0;
}

// Helper function to check if a token type is an operator
function isOperator(type: string | null): boolean {
  return (
    type === "+" || type === "-" || type === "*" || type === "/" || type === "^"
  );
}

// Validate the token stream for common syntax errors and split into multiple expressions if needed
function validateTokenStream(lexer: Lexer): Lexer[] {
  // Check for unbalanced parentheses
  let openCount = 0;
  for (const token of lexer.tokens) {
    if (token.type === "(") openCount++;
    if (token.type === ")") {
      openCount--;
      if (openCount < 0) {
        throw new Error("Unmatched closing parenthesis");
      }
    }
  }
  if (openCount > 0) {
    throw new Error("Unmatched opening parenthesis");
  }

  // Split into multiple expressions at paren level 0
  const expressions: Token[][] = [];
  let currentExpr: Token[] = [];
  let parenLevel = 0;
  let splitNeeded = false;

  for (let i = 0; i < lexer.tokens.length; i++) {
    const current = lexer.tokens[i];
    const next = lexer.tokens[i + 1];

    // Track paren level
    if (current.type === "(") parenLevel++;

    // Add current token to the current expression
    currentExpr.push(current);

    // Check if we need to split after this token
    if (current.type === ")") parenLevel--;

    // Only split at paren level 0
    if (parenLevel === 0 && next) {
      // Check for adjacent numbers - this indicates we should split
      if (
        (current.type === "NUMBER" ||
          current.type === "NUMBER_WITH_UNIT" ||
          current.type === ")") &&
        (next.type === "NUMBER" ||
          next.type === "NUMBER_WITH_UNIT" ||
          next.type === "(")
      ) {
        splitNeeded = true;
      }

      // Check for consecutive operators
      if (isOperator(current.type) && isOperator(next.type)) {
        // Special case: double minus (--) is not allowed
        if (current.type === "-" && next.type === "-") {
          throw new Error("Double minus (--) is not allowed");
        }

        // Allow for negative numbers after other operators (e.g., 1 + -2, 3 * -4)
        if (next.type === "-" && current.type !== "-") {
          // Negation is allowed after operators other than minus
          splitNeeded = false;
        } else {
          // All other consecutive operators are not allowed
          throw new Error("Consecutive operators are not allowed");
        }
      }

      // If we need to split, finalize the current expression and start a new one
      if (splitNeeded) {
        expressions.push([...currentExpr]);
        currentExpr = [];
        splitNeeded = false;
      }
    }
  }

  // Add the last expression if it's not empty
  if (currentExpr.length > 0) {
    expressions.push(currentExpr);
  }

  // Convert token arrays to Lexer objects
  return expressions.map((tokens) => new Lexer(tokens));
}

function parser(s: string): () => ASTNode {
  const lexer: Lexer = createLexer(s);

  // Run validation checks and get the lexers for each expression
  let lexers = validateTokenStream(lexer);

  // Store results from all expressions
  const results: ASTNode[] = [];

  // Create a parse function factory for a specific lexer
  function createParseFunction(lexer: Lexer) {
    // Create the nud function with the current lexer
    function nud(token: Token): ASTNode {
      if (!NUDS[token.type as keyof typeof NUDS])
        throw new Error(
          `NUD not defined for token type: ${JSON.stringify(token.type)}`
        );
      return NUDS[token.type as keyof typeof NUDS](
        token,
        getBp(token),
        parse,
        lexer
      );
    }

    // Create the led function with the current lexer
    function led(left: ASTNode, token: Token): ASTNode {
      if (!LEDS[token.type as keyof typeof LEDS])
        throw new Error(
          `LED not defined for token type: ${JSON.stringify(token.type)}`
        );
      return LEDS[token.type as keyof typeof LEDS](
        left,
        token,
        getBp(token),
        parse,
        lexer
      );
    }

    // The parse function that uses the specific lexer
    function parse(rbp = 0): ASTNode {
      const token = lexer.next();

      // Validate token
      if (token.type === null && !lexer.eof()) {
        throw new Error("Unexpected token in expression");
      }

      let left = nud(token);

      while (getBp(lexer.peek()) > rbp) {
        left = led(left, lexer.next());
      }

      return left;
    }

    return parse;
  }

  for (const currentLexer of lexers) {
    const parse = createParseFunction(currentLexer);
    results.push(parse());
  }

  return results;
}

parser.visit = function visit(node: ASTNode): UnitValue {
  if (typeof node == "number") return new UnitValue(node);
  if (node instanceof UnitValue) return node;

  const nodeHandlers = {
    id: (n: IdNode) => {
      // Handle constants like PI by wrapping them in UnitValue
      return new UnitValue(n.ref as number);
    },
    "^": (n: BinaryOpNode) => {
      const left = visit(n.left);
      const right = visit(n.right);

      // Only allow power operations on unitless values
      if (!left.isUnitless() || !right.isUnitless()) {
        throw new Error(
          "Power operations can only be performed on unitless values"
        );
      }

      return new UnitValue(Math.pow(left.value, right.value));
    },
    "+": (n: BinaryOpNode) => {
      const left = visit(n.left);
      const right = visit(n.right);
      return left.add(right);
    },
    "-": (n: BinaryOpNode) => {
      const left = visit(n.left);
      const right = visit(n.right);
      return left.subtract(right);
    },
    "*": (n: BinaryOpNode) => {
      const left = visit(n.left);
      const right = visit(n.right);
      return left.multiply(right);
    },
    "/": (n: BinaryOpNode) => {
      const left = visit(n.left);
      const right = visit(n.right);
      return left.divide(right);
    },
    "()": (node: FunctionCallNode) => {
      const args = visit(node.args);
      // Math functions should only operate on the numeric value
      if (
        node.target.id === "floor" ||
        node.target.id === "ceil" ||
        node.target.id === "abs" ||
        node.target.id === "cos"
      ) {
        return new UnitValue(
          (node.target.ref as Function)(args.value),
          args.unit
        );
      }
      // For constants like PI, we need to return a UnitValue
      if (typeof node.target.ref === "number") {
        return new UnitValue(node.target.ref);
      }
      // For other functions, ensure we're passing the value, not the UnitValue object
      return new UnitValue((node.target.ref as Function)(args.value));
    },
    neg: (n: NegationNode) => {
      const value = visit(n.value);
      return value.negate();
    },
  };

  const typedNode = node as BaseNode;
  return nodeHandlers[typedNode.type as keyof typeof nodeHandlers](node as any);
};

parser.calc = function calc(s: string): number | string | (number | string)[] {
  const parsers = parser(s);

  console.log(parsers.map((p) => parser.visit(p)));

  // Process the first result
  const result = parser.visit(parsers[0]);

  // Make sure result is a UnitValue before checking isUnitless
  if (!(result instanceof UnitValue)) {
    // If not a UnitValue, convert it to one
    return result as unknown as number;
  }

  // Return number for unitless values, string for values with units
  if (result.isUnitless()) {
    // If this is a result of dividing same units, return as string
    if (result.fromUnitDivision) {
      return result.value.toString();
    }
    return result.value;
  } else {
    return result.toString();
  }
};

export default parser;
export { parser };
export const calc = parser.calc;
