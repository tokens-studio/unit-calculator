export interface Token {
  type: string;
  match?: string | null;
  strpos?: () => { start: { line: number; column: number } };
}

export const EOF: Token = { type: "EOF", match: null };

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

  expect(type: string): void {
    const t = this.next();
    if (type != t.type)
      throw new Error(`Unexpected token: ${t.match || "<<EOF>>"}`);
  }

  eof(): boolean {
    return this.position >= this.tokens.length;
  }
}

interface TokenDefinition {
  type: string;
  re?: RegExp;
  fn?: () => Token;
}

const numberWithUnitRegexp =
  /^(?<number>\d+(?:\.\d*)?|\.\d+)(?<suffix>[a-zA-Z0-9]+)?/;
const parseNumber = function (value: string): Token | null {
  const { groups } = numberWithUnitRegexp.exec(value);
  if (!groups) return;
  const { number, suffix } = groups;

  return suffix
    ? {
        type: "NUMBER_WITH_UNIT",
        match: number,
      }
    : {
        type: "NUMBER",
        match: `${number}${suffix}`,
      };
};

export default function lex(s: string): Lexer {
  const tokenDefinitions: TokenDefinition[] = [
    numberWithUnitRegexp,
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
  const tokens: Token[] = [];
  while (s.length > 0) {
    const token = tokenDefinitions.find((matcher) =>
      typeof matcher === "function"
        ? matcher(s)
        : normalizeRegExp(matcher.re).test(s)
    );
    if (!token) {
      // Check if this might be a malformed number with trailing garbage
      if (/^\d+[a-zA-Z0-9]/.test(s)) {
        throw new Error(
          `Invalid number format: "${s.match(/^\d+[a-zA-Z0-9]+/)?.[0] || s}"`
        );
      }
      throw new Error(`Unexpected character in input: ${s[0]}`);
    }
    const match =
      typeof token === "function"
        ? matcher(s)
        : normalizeRegExp(token.re).test(s);
    normalizeRegExp(token.re).exec(s);
    if (!match) {
      throw new Error(`Failed to match token: ${token.type}`);
    }
    if (token.type !== "WHITESPACE") {
      tokens.push({ type: token.type, match: match[0] });
    }
    s = s.substring(match[0].length);
  }
  return new Lexer(tokens);
}
