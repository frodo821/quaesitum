import { ASTNode } from "../ast/astNode";
import { TokenType } from "../lexer";

export interface IParser {
  /**
   * throws an syntax error if the current token is not of the expected types
   * @param message error message if the token is not of the expected type
   * @param types expected token types
   */
  assertType(token: TokenType, ...types: TokenType[]): void;

  /**
   * moves to the next token if the current token is of the expected types, otherwise throws an error.
   * @param message
   * @param types
   */
  expectType(message: string, ...types: TokenType[]): void;

  /**
   * scans until the current token is of the expected types, then returns the tokens scanned.
   * @param message error message thrown if the one of the expected types is not found before the end of the token stream
   * @param types expected token types
   * @returns tokens scanned until the expected types are found
   */
  scanUntil(message: string, ...types: TokenType[]): TokenType[];

  /**
   * returns the current token
   * @returns current token
   */
  peek(): TokenType;

  /**
   * returns the next token
   * @returns next token
   */
  peekNext(): TokenType;
}

export interface MatchRule<T extends ASTNode> {
  match(parser: IParser): T | null;
}
