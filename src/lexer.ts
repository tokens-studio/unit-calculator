export type TokenType =
  | "EOF"
  | "NUMBER"
  | "NUMBER_WITH_UNIT"
  | "ID"
  | "+"
  | "-"
  | "*"
  | "/"
  | "^"
  | "("
  | ")"
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

export interface IdentifierToken extends BaseToken {
  type: "ID";
  match: string;
}

export interface OperatorToken extends BaseToken {
  type: "+" | "-" | "*" | "/" | "^";
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
  | IdentifierToken
  | OperatorToken
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

type TokenParser = (s: string) => Token | undefined;

const validCssDimensions = new Set([
  "px",
  "em",
  "rem",
  "%",
  "vh",
  "vw",
  "pt",
  "cm",
  "mm",
  "in",
]);

const numberWithUnitRegexp =
  /^(?<number>\d+(?:\.\d*)?|\.\d+)(?<suffix>[a-zA-Z0-9]+)?/;

const parseNumber = function (value: string): Token | undefined {
  const match = numberWithUnitRegexp.exec(value);

  if (!match || !match.groups) return;

  const { number, suffix } = match.groups;
  const numValue = parseFloat(number);

  if (suffix) {
    if (validCssDimensions.has(suffix)) {
      return {
        type: "NUMBER_WITH_UNIT",
        match: `${number}${suffix}`,
        value: numValue,
        unit: suffix,
      } as NumberWithUnitToken;
    } else {
      throw new Error(`Invalid number format: "${number}${suffix}"`);
    }
  }

  return {
    type: "NUMBER",
    match: number,
    value: numValue,
  } as NumberToken;
};

const parseIdentifier = function (s: string): Token | undefined {
  const match = /^[A-Za-z]+/.exec(s);
  if (match) {
    return {
      type: "ID",
      match: match[0],
    } as IdentifierToken;
  }
};

const parseOperator = function (
  s: string,
  op: "+" | "-" | "*" | "/" | "^"
): Token | undefined {
  if (s[0] === op) {
    return {
      type: op,
      match: op,
    } as OperatorToken;
  }
};

const parseParen = function (s: string, paren: "(" | ")"): Token | undefined {
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

const parsers: TokenParser[] = [
  parseNumber,
  parseIdentifier,
  (s) => parseOperator(s, "+"),
  (s) => parseOperator(s, "-"),
  (s) => parseOperator(s, "*"),
  (s) => parseOperator(s, "/"),
  (s) => parseOperator(s, "^"),
  (s) => parseParen(s, "("),
  (s) => parseParen(s, ")"),
  parseWhitespace,
];

export default function lex(s: string): Lexer {
  const tokens: Token[] = [];
  let charpos = 0;
  let remaining = s;

  while (remaining.length > 0) {
    let wasMatched = false;

    for (const tokenizer of parsers) {
      const token = tokenizer(remaining);
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

  const tokensWithoutWhitespace = tokens.filter(
    ({ type }) => type !== "WHITESPACE"
  );
  return new Lexer(tokensWithoutWhitespace);
}
