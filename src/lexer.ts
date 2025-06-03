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

interface TokenDefinitionObject {
  type: string;
  re: RegExp;
}

type TokenDefinitionFunction = (s: string) => Token | null;

type TokenDefinition = TokenDefinitionObject | TokenDefinitionFunction;

const numberWithUnitRegexp =
  /^(?<number>\d+(?:\.\d*)?|\.\d+)(?<suffix>[a-zA-Z0-9]+)?/;
const parseNumber = function (value: string): Token | null {
  const match = numberWithUnitRegexp.exec(value);
  if (!match || !match.groups) return null;
  const { number, suffix } = match.groups;

  return suffix
    ? {
        type: "NUMBER_WITH_UNIT",
        match: `${number}${suffix}`,
      }
    : {
        type: "NUMBER",
        match: number,
      };
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

export default function lex(s: string): Lexer {
  const normalizeRegExp = (re: RegExp) => new RegExp(`^${re.source}`);
  const tokens: Token[] = [];
  while (s.length > 0) {
    let matched = false;

    // Try each token definition
    for (const def of tokenDefinitions) {
      let matchResult: { type: string; match: string } | null = null;

      if (typeof def === "function") {
        // Function-based matcher
        const tokenResult = def(s);
        if (tokenResult) {
          matchResult = {
            type: tokenResult.type,
            match: tokenResult.match as string,
          };
        }
      } else {
        // RegExp-based matcher
        const re = normalizeRegExp(def.re);
        const regexMatch = re.exec(s);
        if (regexMatch) {
          matchResult = {
            type: def.type,
            match: regexMatch[0],
          };
        }
      }

      if (matchResult) {
        matched = true;
        if (matchResult.type !== "WHITESPACE") {
          tokens.push({
            type: matchResult.type,
            match: matchResult.match,
          });
        }
        s = s.substring(matchResult.match.length);
        break;
      }
    }

    if (!matched) {
      // Check if this might be a malformed number with trailing garbage
      if (/^\d+[a-zA-Z0-9]/.test(s)) {
        throw new Error(
          `Invalid number format: "${s.match(/^\d+[a-zA-Z0-9]+/)?.[0] || s}"`
        );
      }
      throw new Error(`Unexpected character in input: ${s[0]}`);
    }
  }
  return new Lexer(tokens);
}
