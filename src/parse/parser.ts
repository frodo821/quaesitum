import {
  ASTNodeType,
  IdentifierNode,
  SentenceListNode,
  SentenceNode,
  VariableDeclarationNode,
  AssignmentNode,
  IfNode,
  ElseNode,
  ForNode,
  WhileNode,
  ExpressionNode,
  BinaryOpNode,
  UnaryOpNode,
  NumericLiteralNode,
  StringLiteralNode,
  VariableNode,
  ProgramNode,
  ASTNode,
} from "../ast";
import { EmptyNode } from "../ast/astNode";
import {
  CommentNode,
  ComposedIfNode,
  FunctionNode,
  ImperativeNode,
  ReturnNode,
  isComposedIfNode,
} from "../ast/sentence";
import {
  Token,
  TokenType,
  VariableToken,
  UnaryOpToken,
  BinaryOpToken,
  SpecialToken,
} from "../lexer";
import { builtInNames } from "../runtime/builtins";
import { Either, ok, err, Err } from "../util/either";
import { QuaesitumError } from "../errors";

type CodeBlockItem<T = CodeBlockStructure> =
  | {
      type: "token";
      value: Token;
    }
  | {
      type: "codeblock";
      value: T;
    };

type CodeBlockStructure = {
  children: CodeBlockItem[];
  start: number;
  end: number;
};

type CodeBlock = {
  variables: Record<string, Token>;
  unaryOperators: Record<string, Token>;
  binaryOperators: Record<string, Token>;
  children: CodeBlock[];
  start: number;
  end: number;
};

function match(block: CodeBlock, pos: number): CodeBlock[] {
  const ret: CodeBlock[] = [block];
  let current: CodeBlock | null = block;

  depth: while (current !== null) {
    for (const child of current.children) {
      if (child.start <= pos && child.end >= pos) {
        ret.push(child);
        current = child;
        continue depth;
      }
    }

    current = null;
  }

  return ret;
}

export interface QuaesitumSyntaxError extends QuaesitumError {
  type: "SyntaxError";
}

export class Parser {
  private tokens: Token[] = [];
  private prevScanIndices: number[] = [];
  private current: number = 0;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.tokens = [];
    this.prevScanIndices = [];
    this.current = 0;
  }

  move(n: number = 1) {
    this.current += n;
  }

  assertTypeIs(
    message: string,
    ...types: TokenType[]
  ): Either<Token, QuaesitumSyntaxError> {
    if (!types.includes(this.tokens[this.current].type)) {
      return err({
        column: this.tokens[this.current].column,
        lineno: this.tokens[this.current].lineno,
        message,
        type: "SyntaxError",
      });
    }

    return ok(this.tokens[this.current]);
  }

  expectTypeIs(
    message: string,
    ...types: TokenType[]
  ): Either<Token, QuaesitumSyntaxError> {
    const ret = this.assertTypeIs(message, ...types);

    if (ret.isErr()) {
      return ret;
    }

    this.move();
    return ret;
  }

  /**
   * throws an syntax error if the current token is not of the expected types
   * @param message error message if the token is not of the expected type
   * @param types expected token types
   */
  assertType(message: string, ...types: TokenType[]) {
    if (!this.assertTypeIs(message, ...types).isOk()) {
      throw new Error(
        `SyntaxError: ${message} at line ${
          this.tokens[this.current].lineno
        } column ${this.tokens[this.current].column}`
      );
    }
  }

  /**
   * moves to the next token if the current token is of the expected types, otherwise throws an error.
   * @param message
   * @param types
   */
  expectType(message: string, ...types: TokenType[]) {
    this.assertType(message, ...types);
    this.move();
  }

  /**
   * scans until the current token is of the expected types, then returns the tokens scanned.
   * @param message error message thrown if the one of the expected types is not found before the end of the token stream
   * @param types expected token types
   * @returns tokens scanned until the expected types are found
   */
  scanUntil(message: string, ...types: TokenType[]): Token[] {
    let tokens: Token[] = [];
    let starting = this.current;

    while (!types.includes(this.tokens[this.current].type)) {
      tokens.push(this.tokens[this.current]);
      this.move();

      if (this.current >= this.tokens.length) {
        throw new Error(
          `SyntaxError: ${message} at line ${this.tokens[starting].lineno} column ${this.tokens[starting].column}`
        );
      }
    }
    this.move();
    return tokens;
  }

  /**
   * peeks at the current token
   * @returns token at the current index
   */
  peek() {
    return this.tokens[this.current];
  }

  /**
   * peeks at the next token
   * @returns token at the next index
   */
  peekNext() {
    return this.tokens[this.current + 1];
  }

  /**
   * parses a node. use this method with commit() and rollback() to backtrack if the parsing fails.
   */
  private enter() {
    this.prevScanIndices.unshift(this.current);
  }

  /**
   * commits the current scan index
   */
  private commit() {
    this.prevScanIndices.shift();
  }

  /**
   * rolls back the current scan index to the previous call of enter()
   */
  private rollback() {
    const index = this.prevScanIndices.shift();

    if (index === undefined) {
      throw new Error(
        "Could not determine the previous scan index. This may be a bug of this compiler."
      );
    }

    this.current = index;
  }

  private composeError(
    message: string,
    token: Token,
    type: string = "SyntaxError"
  ): Err<QuaesitumError> {
    return err({
      column: token.column,
      lineno: token.lineno,
      file: token.file ?? "<unknown>",
      message,
      type,
    });
  }

  private scanCodeBlock(
    from: number = 0,
    depth: number = 0,
    debug: boolean = false
  ): CodeBlockStructure {
    const structure: CodeBlockStructure = {
      children: [],
      start: from,
      end: from,
    };
    let current = from;
    let nl = true;

    const output = debug ? process.stdout.write.bind(process.stdout) : () => {};

    while (current < this.tokens.length) {
      const token = this.tokens[current];
      if (token.type === TokenType.END_OF_BLOCK) {
        output(`\n${"  ".repeat(depth - 1)}${token.value}`);
        structure.end = current;
        break;
      }

      if ([TokenType.THEN, TokenType.DO].includes(token.type)) {
        output(` ${token.value}`);
        const children = this.scanCodeBlock(current + 1, depth + 1, debug);
        structure.children.push({ type: "codeblock", value: children });
        current = children.end + 1;
        continue;
      }

      if (nl) {
        output("\n" + "  ".repeat(depth) + token.value);
      } else if (token.type === TokenType.END_OF_SENTENCE) {
        output(token.value);
      } else {
        output(` ${token.value}`);
      }

      nl = token.type === TokenType.END_OF_SENTENCE;

      structure.children.push({ type: "token", value: token });
      current++;
    }

    structure.end = current;
    return structure;
  }

  private scanNames(): Either<CodeBlock, QuaesitumError> {
    const blocks = this.scanCodeBlock(0, 0, !1);
    const root: CodeBlock = {
      children: [],
      start: blocks.start,
      end: blocks.end,
      variables: Object.fromEntries(
        builtInNames.vars.map((name) => [
          name,
          {
            column: 1,
            lineno: 1,
            type: TokenType.IDENTIFIER,
            value: name,
            file: "<builtins>",
          },
        ])
      ),
      unaryOperators: Object.fromEntries(
        builtInNames.unaryOp.map((name) => [
          name,
          {
            column: 1,
            lineno: 1,
            type: TokenType.IDENTIFIER,
            value: name,
            file: "<builtins>",
          },
        ])
      ),
      binaryOperators: Object.fromEntries(
        builtInNames.binaryOp.map((name) => [
          name,
          {
            column: 1,
            lineno: 1,
            type: TokenType.IDENTIFIER,
            value: name,
            file: "<builtins>",
          },
        ])
      ),
    };

    let currentBlock = [blocks];
    let currentIndexInBlock = [0];
    let currentCodeBlock = [root];

    let inComment = false;

    while (currentIndexInBlock.length > 0) {
      if (currentIndexInBlock[0] >= currentBlock[0].children.length) {
        currentIndexInBlock.shift();
        currentBlock.shift();
        const it = currentCodeBlock.shift();
        if (it) {
          currentCodeBlock[0]?.children.push(it);
        }
        continue;
      }

      const current = currentBlock[0].children[currentIndexInBlock[0]];
      currentIndexInBlock[0]++;

      if (inComment) {
        if (
          current.type === "token" &&
          current.value.type === TokenType.END_OF_SENTENCE
        ) {
          inComment = false;
        }
        continue;
      }

      if (current.type === "codeblock") {
        currentIndexInBlock.unshift(0);
        currentCodeBlock.unshift({
          children: [],
          start: current.value.start,
          end: current.value.end,
          variables: {},
          unaryOperators: {},
          binaryOperators: {},
        });
        currentBlock.unshift(current.value);
      } else {
        let token = current.value;

        switch (token.type) {
          case TokenType.NOTE:
            inComment = true;
            break;
          case TokenType.CREATE: {
            let next = currentBlock[0].children[currentIndexInBlock[0]];
            if (
              next?.type !== "token" ||
              next.value.type !== TokenType.VARIABLE
            ) {
              return this.composeError(
                `Expected 'variabilis' after '${token.value}'`,
                token
              );
            }
            currentIndexInBlock[0]++;

            next = currentBlock[0].children[currentIndexInBlock[0]];
            if (
              next?.type !== "token" ||
              next.value.type !== TokenType.IDENTIFIER
            ) {
              return this.composeError(
                `Expected an identifier after 'variabilis'`,
                token
              );
            }
            currentIndexInBlock[0]++;
            currentCodeBlock[0].variables[next.value.value] = next.value;

            next = currentBlock[0].children[currentIndexInBlock[0]];
            if (
              next?.type !== "token" ||
              next.value.type !== TokenType.END_OF_SENTENCE
            ) {
              return this.composeError("Expected '.'", token);
            }
            currentIndexInBlock[0]++;
            break;
          }
          case TokenType.DEFINE: {
            let next = currentBlock[0].children[currentIndexInBlock[0]];

            if (
              next?.type !== "token" ||
              next?.value.type !== TokenType.IDENTIFIER
            ) {
              return this.composeError(
                "Expected an identifier after 'define'",
                token
              );
            }
            const name = next.value.value;
            const nt = next.value;
            currentIndexInBlock[0]++;
            next = currentBlock[0].children[currentIndexInBlock[0]];

            if (next?.type !== "token" || next?.value.type !== TokenType.WITH) {
              return this.composeError(
                "Expected 'cum' after identifier",
                token
              );
            }

            currentIndexInBlock[0]++;
            next = currentBlock[0].children[currentIndexInBlock[0]];

            if (
              next?.type !== "token" ||
              next?.value.type !== TokenType.IDENTIFIER
            ) {
              return this.composeError(
                "Expected identifier after 'cum'",
                token
              );
            }

            currentIndexInBlock[0]++;
            const arg1 = next.value;
            next = currentBlock[0].children[currentIndexInBlock[0]];

            if (next?.type === "codeblock") {
              currentIndexInBlock[0]++;
              currentCodeBlock[0].unaryOperators[name] = nt;

              currentIndexInBlock.unshift(0);
              currentCodeBlock.unshift({
                children: [],
                start: next.value.start,
                end: next.value.end,
                variables: {
                  [arg1.value]: arg1,
                },
                unaryOperators: {},
                binaryOperators: {},
              });
              currentBlock.unshift(next.value);
              break;
            }

            if (next.value.type !== TokenType.AND) {
              return this.composeError("Expected 'face' or 'et'", token);
            }

            currentIndexInBlock[0]++;
            next = currentBlock[0].children[currentIndexInBlock[0]];

            if (
              next?.type !== "token" ||
              next?.value.type !== TokenType.IDENTIFIER
            ) {
              return this.composeError("Expected identifier after 'et'", token);
            }

            const arg2 = next.value;

            currentIndexInBlock[0]++;
            next = currentBlock[0].children[currentIndexInBlock[0]];

            if (next?.type !== "codeblock") {
              return this.composeError(
                "Expected 'tum' after identifier",
                token
              );
            }

            currentCodeBlock[0].binaryOperators[name] = nt;

            currentIndexInBlock.unshift(0);
            currentCodeBlock.unshift({
              children: [],
              start: next.value.start,
              end: next.value.end,
              variables: {
                [arg1.value]: arg1,
                [arg2.value]: arg2,
              },
              unaryOperators: {},
              binaryOperators: {},
            });
            currentBlock.unshift(next.value);
            break;
          }
          default:
            break;
        }
      }
    }

    return ok(root);
  }

  private analyzeIdentifiers(): Either<null, QuaesitumError> {
    const optNames = this.scanNames();

    if (optNames.isErr()) {
      return optNames;
    }

    const names = optNames.value;
    let inComment = false;

    tokens: for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const blocks = match(names, i).reverse();

      if (inComment) {
        if (token.type === TokenType.END_OF_SENTENCE) {
          inComment = false;
        }
        continue;
      }

      if (token.type === TokenType.NOTE) {
        inComment = true;
        continue;
      }

      if (token.type !== TokenType.IDENTIFIER) {
        continue;
      }

      for (const block of blocks) {
        if (block.variables[token.value]) {
          this.tokens[i] = {
            column: token.column,
            lineno: token.lineno,
            type: TokenType.SPECIAL_TOKEN_VARIABLE,
            value: token.value,
            file: token.file,
            definedAt: block.variables[token.value],
          } as VariableToken;
          continue tokens;
        } else if (block.unaryOperators[token.value]) {
          this.tokens[i] = {
            column: token.column,
            lineno: token.lineno,
            type: TokenType.SPECIAL_TOKEN_UNARY_OP,
            value: token.value,
            file: token.file,
            definedAt: block.unaryOperators[token.value],
          } as UnaryOpToken;
          continue tokens;
        } else if (block.binaryOperators[token.value]) {
          this.tokens[i] = {
            column: token.column,
            lineno: token.lineno,
            type: TokenType.SPECIAL_TOKEN_BINARY_OP,
            value: token.value,
            file: token.file,
            definedAt: block.binaryOperators[token.value],
          } as BinaryOpToken;
          continue tokens;
        }
      }

      const prevT = this.tokens[i - 1]?.type;

      if (
        prevT === TokenType.VARIABLE ||
        prevT === TokenType.WITH ||
        prevT === TokenType.AND
      ) {
        continue;
      }

      return err({
        column: token.column,
        lineno: token.lineno,
        file: token.file,
        message: `undefined identifier '${token.value}'`,
        type: "NameError",
      });
    }

    return ok(null);
  }

  private program(): Either<ProgramNode, QuaesitumError> {
    const sentenceList = this.sentenceList();

    if (sentenceList.isErr()) {
      return sentenceList;
    }

    const program = sentenceList.value;

    return ok({
      type: ASTNodeType.PROGRAM,
      program,
      column: 1,
      lineno: 1,
      file: program.file,
    });
  }

  private identifier(): Either<IdentifierNode, QuaesitumError> {
    const current = this.peek();
    const expect = this.expectTypeIs(
      "Expected an identifier",
      TokenType.IDENTIFIER,
      TokenType.SPECIAL_TOKEN_BINARY_OP,
      TokenType.SPECIAL_TOKEN_UNARY_OP,
      TokenType.SPECIAL_TOKEN_VARIABLE
    );

    if (expect.isErr()) {
      return expect;
    }

    return ok({
      type: ASTNodeType.IDENTIFIER,
      column: current.column,
      identifier: current as SpecialToken,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
    });
  }

  private sentenceList(
    needsEOB: boolean = false
  ): Either<SentenceListNode, QuaesitumError> {
    const sentences: SentenceNode[] = [];

    const start = this.peek();

    while (this.current < this.tokens.length) {
      let current = this.peek();
      if (current.type === TokenType.END_OF_BLOCK) {
        this.move();

        return ok({
          type: ASTNodeType.SENTENCE_LIST,
          sentences,
          column: current.column,
          lineno: current.lineno,
          file: current.file ?? "<unknown>",
        });
      }

      const sentence = this.sentence();

      if (sentence.isErr()) {
        return sentence;
      }

      sentences.push(sentence.value);
    }

    if (!needsEOB) {
      return ok({
        type: ASTNodeType.SENTENCE_LIST,
        sentences,
        column: start.column,
        lineno: start.lineno,
        file: start.file ?? "<unknown>",
      });
    }

    const last = this.peek() ?? this.tokens[this.tokens.length - 1] ?? start;

    return err({
      column: last.column,
      lineno: last.lineno,
      file: last.file ?? "<unknown>",
      message: "Unexpected EOF",
      type: "SyntaxError",
    });
  }

  private sentence(): Either<SentenceNode, QuaesitumError> {
    const current = this.peek();
    let sen: Either<SentenceNode, QuaesitumError> = this.variableDeclaration();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.assignment();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.imperative();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.if_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.else_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.for_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.while_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.function_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.return_();

    if (sen.isOk()) {
      return sen;
    }

    sen = this.comment();

    if (sen.isOk()) {
      return sen;
    }

    return err({
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      message: `Unexpected token '${current.value}' found`,
      type: "SyntaxError",
    });
  }

  private variableDeclaration(): Either<
    VariableDeclarationNode,
    QuaesitumError
  > {
    this.enter();
    const current = this.peek();

    let exp = this.expectTypeIs("Expected 'crea'", TokenType.CREATE);
    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    exp = this.expectTypeIs("Expected 'variabilis'", TokenType.VARIABLE);
    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const identifier = this.identifier();

    if (identifier.isErr()) {
      this.rollback();
      return identifier;
    }

    exp = this.expectTypeIs("Expected '.'", TokenType.END_OF_SENTENCE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    this.commit();
    return ok({
      type: ASTNodeType.VARIABLE_DECLARATION,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      identifier: identifier.value,
    });
  }

  private assignment(): Either<AssignmentNode, QuaesitumError> {
    this.enter();
    const current = this.peek();

    let exp = this.expectTypeIs("Expected 'da'", TokenType.ASSIGN);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const identifier = this.identifier();

    if (identifier.isErr()) {
      this.rollback();
      return identifier;
    }

    const expression = this.expression();

    if (expression.isErr()) {
      this.rollback();
      return expression;
    }

    exp = this.expectTypeIs("Expected '.'", TokenType.END_OF_SENTENCE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    this.commit();

    return ok({
      type: ASTNodeType.ASSIGNMENT,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      identifier: identifier.value,
      value: expression.value,
    });
  }

  private imperative(): Either<ImperativeNode, QuaesitumError> {
    this.enter();
    const exp = this.expression();

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const end = this.expectTypeIs("Expected '.'", TokenType.END_OF_SENTENCE);

    if (end.isErr()) {
      this.rollback();
      return end;
    }

    this.commit();

    return ok({
      type: ASTNodeType.IMPERATIVE,
      column: exp.value.column,
      lineno: exp.value.lineno,
      file: exp.value.file ?? "<unknown>",
      value: exp.value,
    });
  }

  private if_(): Either<IfNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("Expected 'si'", TokenType.IF);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const condition = this.expression();

    if (condition.isErr()) {
      this.rollback();
      return condition;
    }

    exp = this.expectTypeIs("Expected 'tum'", TokenType.THEN);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const body = this.sentenceList(true);

    if (body.isErr()) {
      this.rollback();
      return body;
    }

    this.commit();

    return ok({
      type: ASTNodeType.IF,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      condition: condition.value,
      body: body.value,
    });
  }

  private else_(): Either<ElseNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("Expected 'aliter'", TokenType.ELSE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const if_ = this.if_();

    if (if_.isOk()) {
      this.commit();
      return ok({
        type: ASTNodeType.ELSE,
        column: current.column,
        lineno: current.lineno,
        file: current.file ?? "<unknown>",
        body: if_.value,
      });
    }

    exp = this.expectTypeIs("Expected 'tum'", TokenType.THEN);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const body = this.sentenceList(true);

    if (body.isErr()) {
      this.rollback();
      return body;
    }

    this.commit();

    return ok({
      type: ASTNodeType.ELSE,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      body: body.value,
    });
  }

  private for_(): Either<ForNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("Expected 'per'", TokenType.FOR);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const identifier = this.identifier();

    if (identifier.isErr()) {
      this.rollback();
      return identifier;
    }

    const first = this.expectTypeIs(
      "Expected 'ab' or 'ad'",
      TokenType.FROM,
      TokenType.TO
    );

    if (first.isErr()) {
      this.rollback();
      return first;
    }

    const st1 = this.expression();

    if (st1.isErr()) {
      this.rollback();
      return st1;
    }

    const second = this.expectTypeIs(
      "Expected 'ab' or 'ad'",
      TokenType.FROM,
      TokenType.TO
    );

    if (second.isErr()) {
      this.rollback();
      return second;
    }

    if (first.value.type === second.value.type) {
      this.rollback();

      const ft = first.value;

      return err({
        column: current.column,
        lineno: current.lineno,
        file: current.file ?? "<unknown>",
        message: `Expected '${
          ft.type === TokenType.FROM ? "ad" : "ab"
        }' after '${ft.value}'`,
        type: "SyntaxError",
      });
    }

    const st2 = this.expression();

    if (st2.isErr()) {
      this.rollback();
      return st2;
    }

    exp = this.expectTypeIs("Expected 'face'", TokenType.DO);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const body = this.sentenceList(true);

    if (body.isErr()) {
      this.rollback();
      return body;
    }

    this.commit();

    return ok({
      type: ASTNodeType.FOR,
      column: body.value.column,
      lineno: body.value.lineno,
      file: body.value.file ?? "<unknown>",
      variable: identifier.value,
      from: first.value.type === TokenType.FROM ? st1.value : st2.value,
      to: first.value.type === TokenType.FROM ? st2.value : st1.value,
      body: body.value,
    });
  }

  private while_(): Either<WhileNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("Expected 'dum'", TokenType.WHILE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const condition = this.expression();

    if (condition.isErr()) {
      this.rollback();
      return condition;
    }

    exp = this.expectTypeIs("Expected 'face'", TokenType.DO);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const body = this.sentenceList(true);

    if (body.isErr()) {
      this.rollback();
      return body;
    }

    this.commit();

    return ok({
      type: ASTNodeType.WHILE,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      condition: condition.value,
      body: body.value,
    });
  }

  private function_(): Either<FunctionNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("Expected 'define'", TokenType.DEFINE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const identifier = this.identifier();

    if (identifier.isErr()) {
      this.rollback();
      return identifier;
    }

    exp = this.expectTypeIs("Expected 'cum'", TokenType.WITH);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const arg1 = this.identifier();

    if (arg1.isErr()) {
      this.rollback();
      return arg1;
    }

    let arg2: Either<IdentifierNode, QuaesitumError> | null = null;

    if (
      identifier.value.identifier.type === TokenType.SPECIAL_TOKEN_BINARY_OP
    ) {
      exp = this.expectTypeIs("Expected 'et'", TokenType.AND);

      if (exp.isErr()) {
        this.rollback();
        return exp;
      }

      arg2 = this.identifier();

      if (arg2.isErr()) {
        this.rollback();
        return arg2;
      }
    }

    exp = this.expectTypeIs("Expected 'face'", TokenType.DO);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const body = this.sentenceList(true);

    if (body.isErr()) {
      this.rollback();
      return body;
    }

    this.commit();

    return ok({
      type: ASTNodeType.FUNCTION,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      identifier: identifier.value,
      param1: arg1.value,
      param2: arg2?.value ?? null,
      body: body.value,
    });
  }

  private return_(): Either<ReturnNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    let exp = this.expectTypeIs("", TokenType.RETURN);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    const value = this.expression();

    if (value.isErr()) {
      this.rollback();
      return value;
    }

    exp = this.expectTypeIs("Expected '.'", TokenType.END_OF_SENTENCE);

    if (exp.isErr()) {
      this.rollback();
      return exp;
    }

    return ok({
      type: ASTNodeType.RETURN,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      value: value.value,
    });
  }

  private comment(): Either<CommentNode, QuaesitumError> {
    const current = this.peek();
    this.enter();
    try {
      const note = this.peek();
      this.expectType("Expected 'nota'", TokenType.NOTE);
      const value = this.scanUntil("Unexpected EOF", TokenType.END_OF_SENTENCE)
        .map(({ value }) => value)
        .join(" ");

      this.commit();

      return ok({
        type: ASTNodeType.COMMENT,
        column: note.column,
        lineno: note.lineno,
        file: note.file ?? "<unknown>",
        value,
      });
    } catch {
      this.rollback();

      return err({
        column: current.column,
        lineno: current.lineno,
        file: current.file ?? "<unknown>",
        message: "Expected 'nota'",
        type: "SyntaxError",
      });
    }
  }

  private expression(): Either<ExpressionNode, QuaesitumError> {
    let exp: Either<ExpressionNode, QuaesitumError> = this.binaryOp();

    if (exp.isOk()) {
      return exp;
    }

    return this.leftExpression();
  }

  private leftExpression(): Either<ExpressionNode, QuaesitumError> {
    const current = this.peek();
    let exp: Either<ExpressionNode, QuaesitumError> = this.unaryOp();

    if (exp.isOk()) {
      return exp;
    }

    exp = this.numericLiteral();

    if (exp.isOk()) {
      return exp;
    }

    exp = this.stringLiteral();

    if (exp.isOk()) {
      return exp;
    }

    exp = this.variable();

    if (exp.isOk()) {
      return exp;
    }

    return err({
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      message: `Unexpected token '${this.peek().value}' found`,
      type: "SyntaxError",
    });
  }

  private binaryOp(): Either<BinaryOpNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    const left = this.leftExpression();

    if (left.isErr()) {
      this.rollback();
      return left;
    }

    const op = this.expectTypeIs(
      "Expected a binary operator",
      TokenType.SPECIAL_TOKEN_BINARY_OP
    ) as Either<BinaryOpToken, QuaesitumError>;

    if (op.isErr()) {
      this.rollback();
      return op;
    }

    const right = this.expression();

    if (right.isErr()) {
      this.rollback();
      return right;
    }

    this.commit();

    return ok({
      type: ASTNodeType.BINARY_OP,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      left: left.value,
      operator: op.value,
      right: right.value,
    });
  }

  private unaryOp(): Either<UnaryOpNode, QuaesitumError> {
    this.enter();
    const current = this.peek();
    const op = this.expectTypeIs(
      "Expected a unary operator",
      TokenType.SPECIAL_TOKEN_UNARY_OP
    ) as Either<UnaryOpToken, QuaesitumError>;

    if (op.isErr()) {
      this.rollback();
      return op;
    }

    const operand = this.leftExpression();

    if (operand.isErr()) {
      this.rollback();
      return operand;
    }

    this.commit();

    return ok({
      type: ASTNodeType.UNARY_OP,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      operator: op.value,
      operand: operand.value,
    });
  }

  private numericLiteral(): Either<NumericLiteralNode, QuaesitumError> {
    const current = this.peek();
    const expect = this.expectTypeIs(
      "Expected a numeric literal",
      TokenType.NUMERIC_LITERAL
    );

    if (expect.isErr()) {
      return expect;
    }

    return ok({
      type: ASTNodeType.NUMERIC_LITERAL,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      representation: current,
      value: parseFloat(current.value),
    });
  }

  private stringLiteral(): Either<StringLiteralNode, QuaesitumError> {
    const current = this.peek();
    const expect = this.expectTypeIs(
      "Expected a string literal",
      TokenType.STRING_LITERAL
    );

    if (expect.isErr()) {
      return expect;
    }

    return ok({
      type: ASTNodeType.STRING_LITERAL,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      representation: current,
      value: current.value.substring(1, current.value.length - 1), // remove the quotes
    });
  }

  private variable(): Either<VariableNode, QuaesitumError> {
    const current = this.peek();
    const expect = this.expectTypeIs(
      "Expected a variable",
      TokenType.SPECIAL_TOKEN_VARIABLE,
      TokenType.SPECIAL_TOKEN_BINARY_OP,
      TokenType.SPECIAL_TOKEN_UNARY_OP
    ) as Either<VariableToken, QuaesitumError>;

    if (expect.isErr()) {
      return expect;
    }

    return ok({
      type: ASTNodeType.VARIABLE,
      column: current.column,
      lineno: current.lineno,
      file: current.file ?? "<unknown>",
      identifier: expect.value,
      value: current.value,
    });
  }

  private verifyAST<T extends ASTNode>(
    ast: Either<T, QuaesitumError>,
    parent: ASTNode | null = null,
    nth: number = 0
  ): Either<ASTNode, QuaesitumError> {
    if (ast.isErr()) {
      return ast;
    }

    const val = ast.value;

    switch (val.type) {
      case ASTNodeType.PROGRAM: {
        const p = this.verifyAST(ok(val.program), val, 0);

        if (p.isErr()) {
          return p;
        }

        return ast;
      }
      case ASTNodeType.SENTENCE_LIST: {
        const empties: number[] = [];

        for (let i = 0; i < val.sentences.length; i++) {
          const sentence = val.sentences[i];
          const s = this.verifyAST(ok(sentence), val, i);

          if (s.isErr()) {
            return s;
          }

          if (s.value.type === ASTNodeType.EMPTY) {
            empties.push(i);
          }

          val.sentences[i] = s.value as SentenceNode;
        }

        empties.reverse().forEach((i) => val.sentences.splice(i, 1));

        return ast;
      }
      case ASTNodeType.IF: {
        const c = this.verifyAST(ok(val.condition), val, 0);

        if (c.isErr()) {
          return c;
        }

        const b = this.verifyAST(ok(val.body), val, 1);

        if (b.isErr()) {
          return b;
        }

        return ok({
          type: ASTNodeType.IF,
          body: b.value,
          column: val.column,
          composed: true,
          condition: c.value,
          file: val.file,
          elif: [],
          lineno: val.lineno,
        } as ComposedIfNode);
      }
      case ASTNodeType.ELSE: {
        if (parent?.type !== ASTNodeType.SENTENCE_LIST) {
          return err({
            column: val.column,
            lineno: val.lineno,
            file: val.file,
            message:
              "Illegal 'aliter' placement (parent is not a sentence list)",
            type: "InternalError",
          });
        }

        let prevNode: SentenceNode;
        let i = 1;

        while (
          ((prevNode = parent.sentences[nth - i])?.type as any) ===
          ASTNodeType.EMPTY
        ) {
          i++;

          if (i > nth) {
            return err({
              column: val.column,
              lineno: val.lineno,
              file: val.file,
              message: "no preceding si node found",
              type: "InternalError",
            });
          }
        }

        const prev = prevNode?.type;

        if (prev !== ASTNodeType.IF) {
          return err({
            column: val.column,
            lineno: val.lineno,
            file: val.file,
            message:
              "'aliter' statement must be placed after 'si' or 'aliter' statement",
            type: "SyntaxError",
          });
        }

        if (!isComposedIfNode(prevNode)) {
          return err({
            column: val.column,
            lineno: val.lineno,
            file: val.file,
            message: "Internal error: preceding si node is not composed",
            type: "InternalError",
          });
        }

        if (
          prevNode.elif.length > 0 &&
          prevNode.elif[prevNode.elif.length - 1].body.type !== ASTNodeType.IF
        ) {
          return err({
            column: val.column,
            lineno: val.lineno,
            file: val.file,
            message:
              "cannot place 'aliter' statement after unconditioned 'aliter'",
            type: "SyntaxError",
          });
        }

        const b = this.verifyAST(ok(val.body), val, 0);

        if (b.isErr()) {
          return b;
        }

        prevNode.elif.push(val);

        return ok({
          type: ASTNodeType.EMPTY,
          column: val.column,
          lineno: val.lineno,
          file: val.file,
        } as EmptyNode);
      }
      case ASTNodeType.FOR:
      case ASTNodeType.WHILE:
      case ASTNodeType.FUNCTION: {
        const b = this.verifyAST(ok(val.body), val, 0);

        if (b.isErr()) {
          return b;
        }

        return ast;
      }

      default:
        return ast;
    }
  }

  feed(tokens: Token[]): Either<ProgramNode, QuaesitumError> {
    this.initialize();
    this.tokens = tokens;
    const err = this.analyzeIdentifiers();

    if (err.isErr()) {
      return err;
    }

    return this.verifyAST(this.program()) as Either<
      ProgramNode,
      QuaesitumError
    >;
  }
}
