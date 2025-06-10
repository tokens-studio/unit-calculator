import type { Token } from "./lexer.js";

export function matchesType(
  token: Token,
  typeOrTypes: string | string[]
): boolean {
  if (Array.isArray(typeOrTypes)) {
    return typeOrTypes.includes(token.type);
  }
  return token.type === typeOrTypes;
}
