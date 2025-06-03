import createLexer, {
  Lexer,
  Token,
  TokenType,
  NumberWithUnitToken,
  NumberToken,
} from "./lexer.js";
import { matchesType } from "./token.js";
import { UnitValue } from "./units.js";

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
  EOF: 0,
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

function getBp(token: Token): number {
  return BPS[token.type as keyof typeof BPS] || 0;
}

// NUDS - null denotation - tokens that start expressions
const NUDS: NudFunctions = {
  NUMBER_WITH_UNIT: (t, _bp, _parse, _lexer) => {
    const token = t as NumberWithUnitToken;
    return new UnitValue(token.value, token.unit);
  },
  NUMBER: (t, _bp, _parse, _lexer) => {
    const token = t as NumberToken;
    return new UnitValue(token.value);
  },
  ID: (t, _bp, _parse, _lexer) => {
    const mbr = Math[t.match! as keyof typeof Math];
    if (typeof mbr == "undefined") {
      // Get the character position from the token
      const posInfo =
        typeof t.charpos === "number" ? `at position ${t.charpos}` : "";

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

function isOperator(type: TokenType): type is "+" | "-" | "*" | "/" | "^" {
  return (
    type === "+" || type === "-" || type === "*" || type === "/" || type === "^"
  );
}

const groupEndDelimiters = new Set(["NUMBER", "NUMBER_WITH_UNIT", ")"]);
const isGroupEndDelimiter = (t: Token): boolean =>
  groupEndDelimiters.has(t.type);

const groupStartDelimiters = new Set(["NUMBER", "NUMBER_WITH_UNIT", "(", "ID"]);
const isGroupStartDelimiter = (t: Token): boolean =>
  groupStartDelimiters.has(t.type);

const isGroupSplit = (left: Token, right: Token): boolean =>
  isGroupEndDelimiter(left) && isGroupStartDelimiter(right);

// Validate the token stream for common syntax errors and split into multiple expressions if needed
function validateTokenStream(lexer: Lexer): Lexer[] {
  // Split into multiple expressions at paren level 0
  const expressions: Token[][] = [];
  let currentExpr: Token[] = [];
  let parenLevel = 0;
  let splitNeeded = false;

  for (let i = 0; i < lexer.tokens.length; i++) {
    const current = lexer.tokens[i];
    const next = lexer.tokens[i + 1];

    // Track paren level to determine where to split groups
    if (current.type === "(") parenLevel++;

    currentExpr.push(current);

    if (current.type === ")") {
      parenLevel--;
      if (parenLevel < 0) {
        throw new Error("Unmatched closing parenthesis");
      }
    }

    // Only split at paren level 0
    // Check for adjacent numbers - this indicates we should split
    if (parenLevel === 0 && next) {
      if (isGroupSplit(current, next)) {
        splitNeeded = true;
      }

      // Check for consecutive operators
      // Allow for negative numbers after other operators (e.g., 1 + -2, 3 * -4)
      if (matchesType(next, "-") && !matchesType(current, "-")) {
        splitNeeded = false;
      }

      // If we need to split, finalize the current expression and start a new one
      if (splitNeeded) {
        expressions.push([...currentExpr]);
        currentExpr = [];
        splitNeeded = false;
      }
    }
  }
  if (parenLevel > 0) {
    throw new Error("Unmatched opening parenthesis");
  }

  // Add the last expression if it's not empty
  if (currentExpr.length > 0) {
    expressions.push(currentExpr);
  }

  // Convert token arrays to Lexer objects
  return expressions.map((tokens) => new Lexer(tokens));
}

function createParseFunction(lexer: Lexer) {
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

  function parse(rbp = 0): ASTNode {
    const token = lexer.next();

    if (token.type === "EOF" && !lexer.eof()) {
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

function parse(s: string): ASTNode[] {
  const lexer: Lexer = createLexer(s);

  let lexers = validateTokenStream(lexer);

  const results: ASTNode[] = [];

  for (const currentLexer of lexers) {
    const parse = createParseFunction(currentLexer);
    results.push(parse());
  }

  return results;
}

function evaluateParserNodes(node: ASTNode): UnitValue {
  if (typeof node == "number") return new UnitValue(node);
  if (node instanceof UnitValue) return node;

  const nodeHandlers = {
    id: (n: IdNode) => {
      // Handle constants like PI by wrapping them in UnitValue
      return new UnitValue(n.ref as number);
    },
    "^": (n: BinaryOpNode) => {
      const left = evaluateParserNodes(n.left);
      const right = evaluateParserNodes(n.right);

      // Only allow power operations on unitless values
      if (!left.isUnitless() || !right.isUnitless()) {
        throw new Error(
          "Power operations can only be performed on unitless values"
        );
      }

      return new UnitValue(Math.pow(left.value, right.value));
    },
    "+": (n: BinaryOpNode) => {
      const left = evaluateParserNodes(n.left);
      const right = evaluateParserNodes(n.right);
      return left.add(right);
    },
    "-": (n: BinaryOpNode) => {
      const left = evaluateParserNodes(n.left);
      const right = evaluateParserNodes(n.right);
      return left.subtract(right);
    },
    "*": (n: BinaryOpNode) => {
      const left = evaluateParserNodes(n.left);
      const right = evaluateParserNodes(n.right);
      return left.multiply(right);
    },
    "/": (n: BinaryOpNode) => {
      const left = evaluateParserNodes(n.left);
      const right = evaluateParserNodes(n.right);
      return left.divide(right);
    },
    "()": (node: FunctionCallNode) => {
      const args = evaluateParserNodes(node.args);
      // Math functions should only operate on the numeric value
      if (
        matchesType({ type: node.target.id } as Token, [
          "floor",
          "ceil",
          "abs",
          "cos",
        ])
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
      const value = evaluateParserNodes(n.value);
      return value.negate();
    },
  };

  const typedNode = node as BaseNode;
  return nodeHandlers[typedNode.type as keyof typeof nodeHandlers](node as any);
}

export function calc(s: string): (number | string)[] {
  const parsers = parse(s);

  // Process all results
  const results = parsers.map((p) => {
    const result = evaluateParserNodes(p);

    // Make sure result is a UnitValue before checking isUnitless
    if (!(result instanceof UnitValue)) {
      return result as unknown as number;
    }

    // Return number for unitless values, string for values with units
    // If this is a result of dividing same units, return as string
    if (result.isUnitless()) {
      return result.fromUnitDivision ? result.value.toString() : result.value;
    } else {
      return result.toString();
    }
  });

  return results;
}
