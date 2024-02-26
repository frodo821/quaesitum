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

export class Lexer {
  private readonly tokenPatterns: [TokenType, RegExp][] = [
    [TokenType.CREATE, /^\bcrea\b/],
    [TokenType.VARIABLE, /^\bvariabilis\b/],
    [TokenType.ASSIGN, /^\bda\b/],
    [TokenType.DEFINE, /^\bdefine\b/],
    [TokenType.RETURN, /^\bredi\b/],
    [TokenType.IF, /^\bsi\b/],
    [TokenType.ELSE, /^\baliter\b/],
    [TokenType.THEN, /^\btum\b/],
    [TokenType.FOR, /^\bper\b/],
    [TokenType.WHILE, /^\bdum\b/],
    [TokenType.DO, /^\bface\b/],
    [TokenType.NEW, /^\bforma\b/],
    [TokenType.FROM, /^\bab\b/],
    [TokenType.TO, /^\bad\b/],
    [TokenType.INHERIT, /^\bhereditat\b/],
    [TokenType.END_OF_BLOCK, /^\bhuc finis est(?:\.|,)/],
    [TokenType.NUMERIC_LITERAL, /^\d+/],
    [TokenType.STRING_LITERAL, /^"[^"]*"/],
    [TokenType.END_OF_SENTENCE, /^\.|,/],
    [TokenType.NOTE, /^nota\b/],
    [TokenType.WITH, /^\bcum\b/],
    [TokenType.IDENTIFIER, /^\b[a-zA-Z_][a-zA-Z0-9_]*\b/],
    [TokenType.UNKNOWN, /^\S+/], // Captures any unknown pattern
  ];

  private calcLineno(reading: number, str: string): [number, number] {
    const lines = str.substring(0, reading).split("\n");
    const lineno = lines.length;
    return [lineno, lines[lines.length - 1].length + 1];
  }

  tokenize(input: string, fileName: string = "<string>"): Token[] {
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
        throw new Error(
          `Unknown token '${input}' at line ${lineno}, column ${column} in ${fileName}`
        );
      }
    }

    return tokens;
  }
}
