import { QuaesitumSyntaxError } from "../parse/parser";
import { Either, err, ok } from "../util/either";

export enum TokenType {
  CREATE = "CREA",
  VARIABLE = "VARIABILIS",
  ASSIGN = "DA",
  DEFINE = "DEFINE",
  RETURN = "REDI",
  IF = "SI",
  ELSE = "ALITER",
  THEN = "TUM",
  FOR = "PER",
  WHILE = "DUM",
  DO = "FACE",
  NEW = "FORMA",
  FROM = "AB",
  TO = "AD",
  INHERIT = "HEREDITAT",
  END_OF_BLOCK = "END_OF_BLOCK",
  NUMERIC_LITERAL = "NUMERIC_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  IDENTIFIER = "IDENTIFIER",
  END_OF_SENTENCE = "END_OF_SENTENCE",
  NOTE = "NOTA",
  WITH = "CUM",
  AND = "ET",
  IMPORT = "IMPORT",
  UNKNOWN = "UNKNOWN",
  SPECIAL_TOKEN_VARIABLE = "SPEC_VARIABLE",
  SPECIAL_TOKEN_UNARY_OP = "SPEC_UNARY_OP",
  SPECIAL_TOKEN_BINARY_OP = "SPEC_BINARY_OP",
}

export interface Token {
  type: TokenType;
  value: string;
  lineno: number;
  column: number;
  file?: string | undefined;
}

export interface IdentifierToken extends Token {
  type: TokenType.IDENTIFIER;
}

export interface VariableToken extends Token {
  type: TokenType.SPECIAL_TOKEN_VARIABLE;
  definedAt: IdentifierToken;
}

export interface UnaryOpToken extends Token {
  type: TokenType.SPECIAL_TOKEN_UNARY_OP;
  definedAt: IdentifierToken;
}

export interface BinaryOpToken extends Token {
  type: TokenType.SPECIAL_TOKEN_BINARY_OP;
  definedAt: IdentifierToken;
}

export type SpecialToken = VariableToken | UnaryOpToken | BinaryOpToken;

export const Keywords = [
  "crea",
  "variabile",
  "da",
  "define",
  "redi",
  "si",
  "aliter",
  "tum",
  "per",
  "dum",
  "face",
  "forma",
  "ab",
  "ad",
  "hereditat",
  "huc finis est.",
  "nota",
  "cum",
  "et",
  "profer",
] as const;

export class Lexer {
  private readonly tokenPatterns: [TokenType, RegExp][] = [
    [TokenType.CREATE, /^crea\b/],
    [TokenType.VARIABLE, /^variabile\b/],
    [TokenType.ASSIGN, /^da\b/],
    [TokenType.DEFINE, /^define\b/],
    [TokenType.RETURN, /^redi\b/],
    [TokenType.IF, /^si\b/],
    [TokenType.ELSE, /^aliter\b/],
    [TokenType.THEN, /^tum\b/],
    [TokenType.FOR, /^per\b/],
    [TokenType.WHILE, /^dum\b/],
    [TokenType.DO, /^face\b/],
    [TokenType.NEW, /^forma\b/],
    [TokenType.FROM, /^ab\b/],
    [TokenType.TO, /^ad\b/],
    [TokenType.INHERIT, /^hereditat\b/],
    [TokenType.END_OF_BLOCK, /^huc finis est(?:\.|,)/],
    [TokenType.NUMERIC_LITERAL, /^[\d_]+(?:\.[\d_]+)?(?:[eE][+-]?\d+)?|^\.\d+/],
    [TokenType.STRING_LITERAL, /^"[^"]*"/],
    [TokenType.END_OF_SENTENCE, /^(?:\.|,)/],
    [TokenType.NOTE, /^nota\b/],
    [TokenType.WITH, /^cum\b/],
    [TokenType.AND, /^et\b/],
    [TokenType.IMPORT, /^profer\b/],
    [TokenType.IDENTIFIER, /^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9]*)*\b/i],
    [TokenType.UNKNOWN, /^\S+?(?:\b|(?=[\s,.]))/], // Captures any unknown pattern
  ];

  private calcLineno(reading: number, str: string): [number, number] {
    const lines = str.substring(0, reading).split("\n");
    const lineno = lines.length;
    return [lineno, lines[lines.length - 1].length + 1];
  }

  tokenize(
    input: string,
    fileName: string = "<string>"
  ): Either<Token[], QuaesitumSyntaxError> {
    let tokens: Token[] = [];
    let match: RegExpExecArray | null;
    const initialInput = input;
    const length = input.length;

    while (input.length > 0) {
      input = input.trimStart(); // Remove leading whitespace

      if (input.length === 0) {
        break;
      }

      let tokenMatched = false;

      const [lineno, column] = this.calcLineno(
        length - input.length,
        initialInput
      );

      for (let [type, pattern] of this.tokenPatterns) {
        if ((match = pattern.exec(input))) {
          tokens.push({
            type,
            value: match[0],
            lineno,
            column,
            file: fileName,
          });
          input = input.substring(match[0].length);
          tokenMatched = true;
          break;
        }
      }

      if (!tokenMatched) {
        return err({
          column,
          lineno,
          file: fileName,
          message: `unknown character '${input[0]}'`,
          type: "SyntaxError",
        });
      }
    }

    return ok(tokens);
  }
}
