import { UnitValue } from "./units.js";

export interface Token {
  type: string | null;
  match?: string | null;
  strpos?: () => { start: { line: number; column: number } };
}

export const EOF: Token = { type: null, match: null };

export class Lexer {
  tokens: Token[];
  position: number;

  constructor(tkns: Token[]) {
    this.tokens = tkns;
    this.position = 0;
  }

  peek(): Token {
    return this.tokens[this.position] || EOF;
  }

  next(): Token {
    return this.tokens[this.position++] || EOF;
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
  re: RegExp;
}

export default function lex(s: string): Lexer {
  const tokens: TokenDefinition[] = [
    {
      type: "NUMBER_WITH_UNIT",
      re: /(?:\d+(?:\.\d*)?|\.\d+)(?:px|em|rem|%|vh|vw|vmin|vmax|cm|mm|in|pt|pc)/,
    },
    { type: "NUMBER", re: /(?:\d+(?:\.\d*)?|\.\d+)/ },
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
  const tkns: Token[] = [];
  while (s.length > 0) {
    const token = tokens.find((t) => normalizeRegExp(t.re).test(s));
    if (!token) {
      throw new Error(`Unexpected character in input: ${s[0]}`);
    }
    const match = normalizeRegExp(token.re).exec(s);
    if (!match) {
      throw new Error(`Failed to match token: ${token.type}`);
    }
    if (token.type !== "WHITESPACE") {
      tkns.push({ type: token.type, match: match[0] });
    }
    s = s.substr(match[0].length);
  }
  return new Lexer(tkns);
}
