import type { Token } from "./lexer.ts";

/**
 * Checks if a token's type matches the specified type or any of the types in an array
 * @param token The token to check
 * @param typeOrTypes The expected token type or array of possible token types
 * @returns True if the token type matches
 */
export function matchesType(
  token: Token,
  typeOrTypes: string | string[]
): boolean {
  if (Array.isArray(typeOrTypes)) {
    return typeOrTypes.includes(token.type);
  }
  return token.type === typeOrTypes;
}
