import { Token, TokenType } from "../lexer";

export { Token, TokenType };

export enum ASTNodeType {
  PROGRAM = "PROGRAM",
  SENTENCE_LIST = "SENTENCE_LIST",
  IDENTIFIER = "IDENTIFIER",

  VARIABLE_DECLARATION = "VARIABLE_DECLARATION",
  ASSIGNMENT = "ASSIGNMENT",
  IF = "IF",
  ELSE = "ELSE",
  FOR = "FOR",
  WHILE = "WHILE",
  FUNCTION = "FUNCTION",
  RETURN = "RETURN",
  COMMENT = "COMMENT",
  IMPERATIVE = "IMPERATIVE",

  EXPRESSION = "EXPRESSION",
  BINARY_OP = "BINARY_OP",
  UNARY_OP = "UNARY_OP",
  NUMERIC_LITERAL = "NUMERICAL_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  VARIABLE = "VARIABLE",
}

export interface ASTNodeBase {
  type: ASTNodeType;
  column: number;
  lineno: number;
  file: string;
}
