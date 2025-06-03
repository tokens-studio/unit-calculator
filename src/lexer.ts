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
  strpos?: () => { start: { line: number; column: number } };
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

export const EOF: EOFToken = { type: "EOF", match: null };

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

interface TokenDefinitionObject {
  type: TokenType;
  re: RegExp;
}

type TokenDefinitionFunction = (s: string) => Token | null;

type TokenDefinition = TokenDefinitionObject | TokenDefinitionFunction;

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
const parseNumber = function (value: string): Token | null {
  const match = numberWithUnitRegexp.exec(value);
  if (!match || !match.groups) return null;
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

const tokenDefinitions: TokenDefinition[] = [
  parseNumber,
  { type: "ID", re: /[A-Za-z]+/ },
  { type: "+", re: /\+/ },
  { type: "-", re: /-/ },
  { type: "*", re: /\*/ },
  { type: "/", re: /\// },
  { type: "^", re: /\^/ },
  { type: "(", re: /\(/ },
  { type: ")", re: /\)/ },
  { type: "WHITESPACE", re: /\s+/ },
];

const normalizeRegExp = (re: RegExp) => new RegExp(`^${re.source}`);

const matchTokenDefinition = function (
  s: string,
  def: TokenDefinition
): Token | null {
  if (typeof def === "function") {
    return def(s);
  } else {
    const re = normalizeRegExp(def.re);
    const match = re.exec(s);
    if (match) {
      if (def.type === "ID") {
        return {
          type: def.type,
          match: match[0],
        } as IdentifierToken;
      } else if (
        def.type === "+" ||
        def.type === "-" ||
        def.type === "*" ||
        def.type === "/" ||
        def.type === "^"
      ) {
        return {
          type: def.type,
          match: match[0],
        } as OperatorToken;
      } else if (def.type === "(" || def.type === ")") {
        return {
          type: def.type,
          match: match[0],
        } as ParenToken;
      } else if (def.type === "WHITESPACE") {
        return {
          type: def.type,
          match: match[0],
        } as WhitespaceToken;
      }
    }
  }
  return null;
};

export default function lex(s: string): Lexer {
  const tokens: Token[] = [];
  while (s.length > 0) {
    let wasMatched = false;

    for (const tokenizer of tokenDefinitions) {
      const token = tokenizer(s);
      if (token) {
        wasMatched = true;
        tokens.push(token);
        s = s.substring(token.match!.length);
        break;
      }
    }

    if (!wasMatched) {
      throw new Error(`Unexpected character in input: ${s[0]}`);
    }
  }

  const tokensWithoutWhitespace = tokens.filter(
    ({ type }) => type !== "WHITESPACE"
  );
  return new Lexer(tokensWithoutWhitespace);
}
