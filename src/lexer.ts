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

  if (suffix) {
    if (validCssDimensions.has(suffix)) {
      return {
        type: "NUMBER_WITH_UNIT",
        match: `${number}${suffix}`,
      };
    } else {
      throw new Error(`Invalid number format: "${number}${suffix}"`);
    }
  }

  return {
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

const normalizeRegExp = (re: RegExp) => new RegExp(`^${re.source}`);

const matchTokenDefinition = function (
  s: string,
  def: TokenDefinition
): Token | null {
  if (typeof def === "function") {
    const token = def(s);
    if (token) {
      return {
        type: token.type,
        match: token.match as string,
      };
    }
  } else {
    const re = normalizeRegExp(def.re);
    const match = re.exec(s);
    if (match) {
      return {
        type: def.type,
        match: match[0],
      };
    }
  }
};

export default function lex(s: string): Lexer {
  const tokens: Token[] = [];
  while (s.length > 0) {
    let wasMatched = false;

    for (const def of tokenDefinitions) {
      const token = matchTokenDefinition(s, def);
      if (token) {
        wasMatched = true;
        tokens.push({
          type: token.type,
          match: token.match,
        });
        s = s.substring(token.match.length);
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
