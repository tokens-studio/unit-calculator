import { Token } from "./lexer.js";

export function matchesType(token: Token, type: string): boolean {
  return token.type === type;
}

/**
 * Checks if a token's type matches any of the specified types
 * @param token The token to check
 * @param types Array of possible token types
 * @returns True if the token type matches any of the specified types
 */
export function matchesAnyType(token: Token, types: string[]): boolean {
  return types.includes(token.type as string);
}
