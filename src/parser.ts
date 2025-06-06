import type { CalcConfig } from "./config.js";
import { defaultConfig } from "./config.js";
import createLexer, { Lexer } from "./lexer.js";
import type { NumberToken, NumberWithUnitToken, Token } from "./lexer.js";
import type { IUnitValue } from "./utils/units.d.js";
import { UnitValue } from "./units.js";

type NodeType = "id" | "+" | "-" | "*" | "/" | "^" | "()" | "neg";
type BinaryOpType = "+" | "-" | "*" | "/" | "^";
type ParseFunction = (rbp?: number) => ASTNode;

interface BaseNode {
  type: NodeType;
}

interface IdNode extends BaseNode {
  type: "id";
  ref: number | Function;
  id: string;
}

interface BinaryOpNode extends BaseNode {
  type: BinaryOpType;
  left: ASTNode;
  right: ASTNode;
}

interface FunctionCallNode extends BaseNode {
  type: "()";
  target: IdNode;
  args: ASTNode[];
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
  | IUnitValue
  | number;

type NudFunction = (
  token: Token,
  bp: number,
  parse: ParseFunction,
  lexer: Lexer,
  config: CalcConfig
) => ASTNode;

type LedFunction = (
  left: ASTNode,
  token: Token,
  bp: number,
  parse: ParseFunction,
  lexer: Lexer,
  config: CalcConfig
) => ASTNode;

const BPS = {
  EOF: 0,
  NUMBER: 0,
  NUMBER_WITH_UNIT: 0,
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

const NUDS: Record<string, NudFunction> = {
  NUMBER_WITH_UNIT: (t, _bp, _parse, _lexer, config) =>
    new UnitValue(
      (t as NumberWithUnitToken).value,
      (t as NumberWithUnitToken).unit,
      false,
      config
    ),
  NUMBER: (t, _bp, _parse, _lexer, config) =>
    new UnitValue((t as NumberToken).value, null, false, config),
  ID: (t, _bp, _parse, _lexer, config) => {
    const id = t.match!;

    if (config.mathFunctions && id in config.mathFunctions) {
      return {
        type: "id",
        ref: config.mathFunctions[id],
        id,
      } as IdNode;
    }

    const mathConstant = Math[id as keyof typeof Math];
    if (
      typeof mathConstant !== "undefined" &&
      typeof mathConstant !== "function"
    ) {
      return {
        type: "id",
        ref: mathConstant,
        id,
      } as IdNode;
    }

    const posInfo = t.charpos !== undefined ? `at position ${t.charpos}` : "";
    throw new Error(
      `Unknown expression: '${id}'${
        posInfo ? " " + posInfo : ""
      }. Only configured math functions and constants are supported.`
    );
  },
  "+": (_t, bp, parse, _lexer, _config) => parse(bp),
  "-": (_t, bp, parse, _lexer, _config) =>
    ({ type: "neg", value: parse(bp) } as NegationNode),
  "(": (_t, _bp, parse, lexer, _config) => {
    const inner = parse();
    lexer.expect(")");
    return inner;
  },
};

const createBinaryOp =
  (type: BinaryOpType): LedFunction =>
  (left, _t, bp, parse, _lexer, _config) =>
    ({ type, left, right: parse(bp) } as BinaryOpNode);

const LEDS: Record<string, LedFunction> = {
  "+": createBinaryOp("+"),
  "-": createBinaryOp("-"),
  "*": createBinaryOp("*"),
  "/": createBinaryOp("/"),
  "^": (left, _t, bp, parse, _lexer, _config) =>
    ({ type: "^", left, right: parse(bp - 1) } as BinaryOpNode),

  "(": (left, _t, _bp, parse, lexer, _config) => {
    if ((left as IdNode).type !== "id") {
      throw new Error("Cannot invoke expression as if it was a function");
    }

    const idNode = left as IdNode;
    if (typeof idNode.ref !== "function") {
      throw new Error("Cannot invoke non-function");
    }

    // Parse arguments (comma-separated)
    const args: ASTNode[] = [];

    // Functions must have at least one argument
    if (lexer.peek().type === ")") {
      throw new Error(`Function ${idNode.id}() called with no arguments`);
    }

    // Parse first argument - use parse(0) to allow full expressions
    args.push(parse(0));

    // Parse additional arguments if any
    while (lexer.peek().type === ",") {
      lexer.next(); // consume comma
      args.push(parse(0));
    }

    lexer.expect(")");
    return { type: "()", target: idNode, args } as FunctionCallNode;
  },
};

const GROUP_END = new Set(["NUMBER", "NUMBER_WITH_UNIT", ")"]);
const GROUP_START = new Set(["NUMBER", "NUMBER_WITH_UNIT", "(", "ID"]);
const isGroupSplit = (left: Token, right: Token): boolean =>
  GROUP_END.has(left.type) && GROUP_START.has(right.type);

function validateTokenStream(lexer: Lexer): Lexer[] {
  const expressions: Token[][] = [];
  let currentExpr: Token[] = [];
  let parenLevel = 0;

  for (let i = 0; i < lexer.tokens.length; i++) {
    const current = lexer.tokens[i];
    const next = lexer.tokens[i + 1];

    if (current.type === "," && parenLevel === 0) {
      throw new Error("Commas are only allowed inside function arguments");
    }

    if (current.type === "(") parenLevel++;
    currentExpr.push(current);

    if (current.type === ")") {
      parenLevel--;
      if (parenLevel < 0) throw new Error("Unmatched closing parenthesis");
    }

    // Split into new group
    if (parenLevel === 0 && next && isGroupSplit(current, next)) {
      expressions.push([...currentExpr]);
      currentExpr = [];
    }
  }

  if (parenLevel > 0) throw new Error("Unmatched opening parenthesis");
  if (currentExpr.length > 0) expressions.push(currentExpr);

  return expressions.map((tokens) => new Lexer(tokens));
}

function createParseFunction(lexer: Lexer, config: CalcConfig): ParseFunction {
  const nud = (token: Token): ASTNode => {
    const nudFn = NUDS[token.type];
    if (!nudFn)
      throw new Error(`NUD not defined for token type: ${token.type}`);
    return nudFn(token, getBp(token), parse, lexer, config);
  };

  const led = (left: ASTNode, token: Token): ASTNode => {
    const ledFn = LEDS[token.type];
    if (!ledFn)
      throw new Error(`LED not defined for token type: ${token.type}`);
    return ledFn(left, token, getBp(token), parse, lexer, config);
  };

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

function parse(s: string, options: Partial<CalcConfig> = {}): ASTNode[] {
  const config = { ...defaultConfig, ...options };
  return validateTokenStream(createLexer(s, options)).map((lexer) =>
    createParseFunction(lexer, config)()
  );
}

function evaluateParserNodes(node: ASTNode, config: CalcConfig): IUnitValue {
  if (typeof node === "number") return new UnitValue(node, null, false, config);
  if (node instanceof UnitValue) return node;

  const typedNode = node as BaseNode;

  switch (typedNode.type) {
    case "id":
      return new UnitValue((node as IdNode).ref as number, null, false, config);

    case "^": {
      const n = node as BinaryOpNode;
      const left = evaluateParserNodes(n.left, config);
      const right = evaluateParserNodes(n.right, config);

      if (!left.isUnitless() || !right.isUnitless()) {
        throw new Error(
          "Power operations can only be performed on unitless values"
        );
      }

      return new UnitValue(
        Math.pow(left.value, right.value),
        null,
        false,
        config
      );
    }

    case "+": {
      const n = node as BinaryOpNode;
      return evaluateParserNodes(n.left, config).add(
        evaluateParserNodes(n.right, config)
      );
    }

    case "-": {
      const n = node as BinaryOpNode;
      return evaluateParserNodes(n.left, config).subtract(
        evaluateParserNodes(n.right, config)
      );
    }

    case "*": {
      const n = node as BinaryOpNode;
      return evaluateParserNodes(n.left, config).multiply(
        evaluateParserNodes(n.right, config)
      );
    }

    case "/": {
      const n = node as BinaryOpNode;
      return evaluateParserNodes(n.left, config).divide(
        evaluateParserNodes(n.right, config)
      );
    }

    case "()": {
      const n = node as FunctionCallNode;
      const evaluatedArgs = n.args.map((arg) =>
        evaluateParserNodes(arg, config)
      );

      // Handle constants
      if (typeof n.target.ref === "number") {
        return new UnitValue(n.target.ref, null, false, config);
      }

      const result = (n.target.ref as Function)(...evaluatedArgs);

      if (result instanceof UnitValue) {
        return result;
      }

      // Handle simple record format {value: number; unit: string | null}
      if (result && typeof result === "object" && "value" in result) {
        return new UnitValue(
          result.value,
          result.unit,
          evaluatedArgs[0].fromUnitDivision,
          config
        );
      }

      if (typeof result === "number") {
        // Use the first argument's unit
        const unit = evaluatedArgs[0].unit;
        // Create a UnitValue with the result and the unit from the first argument
        return new UnitValue(
          result,
          unit,
          evaluatedArgs[0].fromUnitDivision,
          config
        );
      }

      // If the result is something else (like a string), convert to number and use first arg's unit
      return new UnitValue(
        Number(result),
        evaluatedArgs[0].unit,
        false,
        config
      );
    }

    case "neg":
      return evaluateParserNodes((node as NegationNode).value, config).negate();

    default:
      throw new Error(`Unknown node type: ${typedNode.type}`);
  }
}

export interface RunResult {
  parsers: ASTNode[];
  exec: () => IUnitValue[];
}

export function run(s: string, options: Partial<CalcConfig> = {}): RunResult {
  const config = { ...defaultConfig, ...options };
  const parsers = parse(s, config);

  return {
    parsers,
    exec: (ps = parsers) => parsers.map((p) => evaluateParserNodes(p, config)),
  };
}

export function calc(
  s: string,
  options: Partial<CalcConfig> = {}
): (number | string)[] {
  const config = { ...defaultConfig, ...options };
  const parsers = parse(s, config);

  const results = parsers.map((p) => {
    const result = evaluateParserNodes(p, config);

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
