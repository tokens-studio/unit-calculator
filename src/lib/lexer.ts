import type { CalcConfig } from "./config.js";
import { createConfig, defaultConfig } from "./config.js";
import { UnsupportedUnitError } from "./utils/errors.js";

export type TokenType =
  | "EOF"
  | "NUMBER"
  | "NUMBER_WITH_UNIT"
  | "FUNCTION_ID"
  | "CONSTANT_ID"
  | "STRING"
  | "+"
  | "-"
  | "*"
  | "/"
  | "^"
  | "("
  | ")"
  | ","
  | "WHITESPACE";

export interface BaseToken {
  type: TokenType;
  match?: string | null;
  charpos?: number;
}

export interface EOFToken extends BaseToken {
  type: "EOF";
  match: null;
}

export interface NumberToken extends BaseToken {
  type: "NUMBER";
  match: string;
  value: number;
}

export interface NumberWithUnitToken extends BaseToken {
  type: "NUMBER_WITH_UNIT";
  match: string;
  value: number;
  unit: string;
}

export interface FunctionIdToken extends BaseToken {
  type: "FUNCTION_ID";
  match: string;
}

export interface ConstantIdToken extends BaseToken {
  type: "CONSTANT_ID";
  match: string;
}

export interface StringToken extends BaseToken {
  type: "STRING";
  match: string;
  value: string;
}

export interface OperatorToken extends BaseToken {
  type: "+" | "-" | "*" | "/" | "^";
  match: string;
}

export interface CommaToken extends BaseToken {
  type: ",";
  match: string;
}

export interface ParenToken extends BaseToken {
  type: "(" | ")";
  match: string;
}

export interface WhitespaceToken extends BaseToken {
  type: "WHITESPACE";
  match: string;
}

export type Token =
  | EOFToken
  | NumberToken
  | NumberWithUnitToken
  | FunctionIdToken
  | ConstantIdToken
  | StringToken
  | OperatorToken
  | CommaToken
  | ParenToken
  | WhitespaceToken;

export const EOF: EOFToken = { type: "EOF", match: null, charpos: -1 };

export class Lexer {
  tokens: Token[];
  position: number;

  constructor(tkns: Token[]) {
    this.tokens = tkns;
    this.position = 0;
  }

  peek(): Token {
    return this.position < this.tokens.length
      ? this.tokens[this.position]
      : EOF;
  }

  next(): Token {
    return this.position < this.tokens.length
      ? this.tokens[this.position++]
      : EOF;
  }

  expect(type: TokenType): void {
    const t = this.next();
    if (type != t.type)
      throw new Error(`Unexpected token: ${t.match || "<<EOF>>"}`);
  }

  eof(): boolean {
    return this.position >= this.tokens.length;
  }
}

type TokenParser = (
  s: string,
  tokens: Token[],
  config: CalcConfig
) => Token | undefined;

const numberWithUnitRegexp =
  /^(?<sign>-)?(?<number>\d+(?:\.\d*)?|\.\d+)(?<suffix>[a-zA-Z0-9%]+)?/;

const parseNumber = function (
  value: string,
  tokens: Token[],
  config: CalcConfig
): Token | undefined {
  const match = numberWithUnitRegexp.exec(value);

  if (!match || !match.groups) return;

  const { sign, number, suffix } = match.groups;
  const numValue = parseFloat(sign ? sign + number : number);

  // If there's a negative sign, we need to determine if it's a negative number or a subtraction operator
  if (sign === "-") {
    const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
    if (
      prevToken &&
      (prevToken.type === "NUMBER" ||
        prevToken.type === "NUMBER_WITH_UNIT" ||
        prevToken.type === "FUNCTION_ID" ||
        prevToken.type === "CONSTANT_ID" ||
        prevToken.type === ")")
    ) {
      return;
    }
  }

  if (suffix) {
    if (config.allowedUnits.has(suffix)) {
      return {
        type: "NUMBER_WITH_UNIT",
        match: sign ? sign + number + suffix : number + suffix,
        value: numValue,
        unit: suffix,
      } as NumberWithUnitToken;
    } else {
      throw new UnsupportedUnitError(suffix, [...config.allowedUnits]);
    }
  }

  return {
    type: "NUMBER",
    match: sign ? sign + number : number,
    value: numValue,
  } as NumberToken;
};

const parseIdentifier = function (
  s: string,
  _tokens: Token[],
  config: CalcConfig
): Token | undefined {
  const match = /^[A-Za-z0-9]+/.exec(s);
  if (match) {
    const id = match[0];

    if (config.mathFunctions[id]) {
      return {
        type: "FUNCTION_ID",
        match: id,
      } as FunctionIdToken;
    }

    if (config.mathConstants[id]) {
      return {
        type: "CONSTANT_ID",
        match: id,
      } as ConstantIdToken;
    }
  }
};

const parseOperator = function (
  op: "+" | "-" | "*" | "/" | "^",
  s: string
): Token | undefined {
  if (s[0] === op) {
    return {
      type: op,
      match: op,
    } as OperatorToken;
  }
};

const parseComma = function (s: string): Token | undefined {
  if (s[0] === ",") {
    return {
      type: ",",
      match: ",",
    } as CommaToken;
  }
};

const parseParen = function (paren: "(" | ")", s: string): Token | undefined {
  if (s[0] === paren) {
    return {
      type: paren,
      match: paren,
    } as ParenToken;
  }
};

const parseWhitespace = function (s: string): Token | undefined {
  const match = /^\s+/.exec(s);
  if (match) {
    return {
      type: "WHITESPACE",
      match: match[0],
    } as WhitespaceToken;
  }
};

function isOperator(type: TokenType): type is "+" | "-" | "*" | "/" | "^" {
  return (
    type === "+" || type === "-" || type === "*" || type === "/" || type === "^"
  );
}

const parseString = function (s: string): Token | undefined {
  const match = /^[^ ]*/.exec(s);
  if (match) {
    return {
      type: "STRING",
      match: match[0],
      value: match[0],
    } as StringToken;
  }
};

const tokenizers: TokenParser[] = [
  parseWhitespace,
  parseNumber,
  parseIdentifier,
  (s, _tokens, _config) => parseOperator("+", s),
  (s, _tokens, _config) => parseOperator("-", s),
  (s, _tokens, _config) => parseOperator("*", s),
  (s, _tokens, _config) => parseOperator("/", s),
  (s, _tokens, _config) => parseOperator("^", s),
  (s, _tokens, _config) => parseParen("(", s),
  (s, _tokens, _config) => parseParen(")", s),
  parseComma,
  parseString,
];

export default function lex(
  s: string,
  options: Partial<CalcConfig> = defaultConfig
): Lexer {
  const config = createConfig(options);
  const tokens: Token[] = [];
  let charpos = 0;
  let remaining = s;

  while (remaining.length > 0) {
    let wasMatched = false;

    for (const tokenizer of tokenizers) {
      const token = tokenizer(remaining, tokens, config);

      if (token) {
        wasMatched = true;

        token.charpos = charpos;
        tokens.push(token);

        charpos += token.match!.length;
        remaining = remaining.substring(token.match!.length);

        break;
      }
    }

    if (!wasMatched) {
      throw new Error(`Unexpected character in input: ${remaining[0]}`);
    }
  }

  const lexableTokens = tokens.reduce((acc, cur, idx, orig) => {
    if (cur.type === "WHITESPACE") return acc;

    const next = orig[idx + 1];

    // Check for consecutive operators (except valid negation)
    if (isOperator(cur.type) && isOperator(next.type)) {
      throw new Error(
        `Consecutive operators not allowed: ${cur.match}${next.match}`
      );
    }
    // Special case for minus: allow it after operators as negation, but not after minus
    if (cur.type === "-" && next.type === "-") {
      throw new Error("Consecutive minus operators not allowed");
    }

    return [...acc, cur];
  }, []);

  return new Lexer(lexableTokens);
}
