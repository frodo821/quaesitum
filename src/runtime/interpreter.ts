import { ASTNode, ASTNodeType, ProgramNode, uneval } from "../ast";
import {
  ExpressionNode,
  isBinaryOpNode,
  isNumericLiteralNode,
  isStringLiteralNode,
  isUnaryOpNode,
  isVariableNode,
} from "../ast/expressions";
import { isComposedIfNode } from "../ast/sentence";
import { QuaesitumError } from "../errors";
import { SpecialToken, TokenType } from "../lexer";
import { Either, err, ok } from "../util/either";
import { binaryOps, unaryOps, constants } from "./builtins";
import { Thesaurus } from "./internal/utils";

export type Environment = {
  vars: Record<string, any>;
  binaryOp: Record<string, (left: any, right: any) => any>;
  unaryOp: Record<string, (operand: any) => any>;
  parent?: Environment;
};

const NameTypes = {
  vars: "variable",
  binaryOp: "binary operator",
  unaryOp: "unary operator",
} as const;

function createEnvironment(parent?: Environment): Environment {
  return {
    vars: {},
    binaryOp: {},
    unaryOp: {},
    parent,
  };
}

function lookupWithTokenType(
  name: string,
  env: Environment,
  tokenType: SpecialToken["type"]
) {
  const TokenTypesMap = {
    [TokenType.SPECIAL_TOKEN_BINARY_OP]: "binaryOp",
    [TokenType.SPECIAL_TOKEN_UNARY_OP]: "unaryOp",
    [TokenType.SPECIAL_TOKEN_VARIABLE]: "vars",
  } as const;

  return lookup(name, env, TokenTypesMap[tokenType]);
}

function lookup(
  name: string,
  env: Environment,
  type: "vars" | "binaryOp" | "unaryOp"
): Either<any, string> {
  if (type === "vars") {
    if (name === "variabilia") {
      return ok(
        Thesaurus.create({
          vars: Thesaurus.create(env.vars),
          binaryOp: Thesaurus.create(env.binaryOp),
          unaryOp: Thesaurus.create(env.unaryOp),
        })
      );
    }
    if (name === "intrinseca") {
      return ok(
        Thesaurus.create({
          vars: Thesaurus.create(constants),
          binaryOp: Thesaurus.create(binaryOps),
          unaryOp: Thesaurus.create(unaryOps),
        })
      );
    }
  }

  if (name in env[type]) {
    return ok(env[type][name]);
  }

  if (typeof env.parent !== "undefined") {
    return lookup(name, env.parent, type);
  }

  return err(`Undefined ${NameTypes[type]}: '${name}'`);
}

function setVar<T>(
  name: string,
  env: Environment,
  value: T
): Either<T, string> {
  if (name in constants) {
    return ok(value);
  }

  if (name in env.vars) {
    env.vars[name] = value;
    return ok(value);
  }

  if (typeof env.parent !== "undefined") {
    setVar(name, env.parent, value);
    return ok(value);
  }

  return err(`Undefined variable: '${name}'`);
}

function debugExpressionToString(
  node: ExpressionNode,
  env: Environment
): string {
  switch (node.type) {
    case ASTNodeType.BINARY_OP: {
      if (!isBinaryOpNode(node)) {
        throw new Error("panic: expected BinaryOpNode");
      }
      return `${debugExpressionToString(node.left, env)} ${
        node.operator.value
      } ${debugExpressionToString(node.right, env)}`;
    }
    case ASTNodeType.UNARY_OP: {
      if (!isUnaryOpNode(node)) {
        throw new Error("panic: expected UnaryOpNode");
      }
      return `${node.operator.value}${debugExpressionToString(
        node.operand,
        env
      )}`;
    }
    case ASTNodeType.NUMERIC_LITERAL: {
      if (!isNumericLiteralNode(node)) {
        throw new Error("panic: expected NumericLiteralNode");
      }
      return `${node.value}`;
    }
    case ASTNodeType.STRING_LITERAL: {
      if (!isStringLiteralNode(node)) {
        throw new Error("panic: expected StringLiteralNode");
      }
      return `"${node.value}"`;
    }
    case ASTNodeType.VARIABLE: {
      if (!isVariableNode(node)) {
        throw new Error("panic: expected VariableNode");
      }
      const val = lookupWithTokenType(
        node.identifier.value,
        env,
        TokenType.SPECIAL_TOKEN_VARIABLE
      );
      if (val.isErr()) {
        return `<undefined or unknown variable>`;
      }

      return `${val.unwrap()}`;
    }
  }
}

type State = {
  isFunctionContext?: boolean;
  toReturn?: boolean;

  // reserved for future use
  toContinue?: boolean;
  toBreak?: boolean;
};

function visit(
  node: ASTNode,
  env: Environment,
  state: State
): Either<any, QuaesitumError> {
  // console.log(
  //   `${node.type} at line ${node.lineno} column ${node.column} in ${node.file}`
  // );
  switch (node.type) {
    case ASTNodeType.PROGRAM:
      return visit(node.program, env, state);
    case ASTNodeType.ASSIGNMENT: {
      const identifier = node.identifier.identifier.value;
      const value = visit(node.value, env, state);

      if (value.isErr()) {
        return value;
      }

      const result = setVar(identifier, env, value.unwrap());

      if (result.isErr()) {
        return err({
          message: result.unwrapErr(),
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "NameError",
        });
      }

      return ok(null);
    }
    case ASTNodeType.BINARY_OP: {
      if (!isBinaryOpNode(node)) {
        throw new Error("panic: expected BinaryOpNode");
      }
      const left = visit(node.left, env, state);
      const right = visit(node.right, env, state);

      if (left.isErr()) {
        return left;
      }

      if (right.isErr()) {
        return right;
      }

      const op = lookupWithTokenType(
        node.operator.value,
        env,
        TokenType.SPECIAL_TOKEN_BINARY_OP
      );

      if (op.isErr()) {
        return err({
          message: op.unwrapErr(),
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "NameError",
        });
      }

      return op.unwrap()(left.unwrap(), right.unwrap());
    }
    case ASTNodeType.COMMENT:
      return ok(null);
    case ASTNodeType.ELSE:
      throw new Error("panic: unexpected ElseNode");
    case ASTNodeType.EMPTY:
      return ok(null);
    case ASTNodeType.FOR: {
      const locals = createEnvironment(env);
      const variable = node.variable.identifier.value;
      const from = visit(node.from, env, state);
      const to = visit(node.to, env, state);

      if (from.isErr()) {
        return from;
      }

      if (to.isErr()) {
        return to;
      }

      let result: Either<any, QuaesitumError> = ok(null);

      for (let i = from.unwrap(); i <= to.unwrap(); i++) {
        setVar(variable, locals, i);
        result = visit(node.body, locals, state);

        if (result.isErr() || state?.toReturn || state?.toBreak) {
          return result;
        }
      }

      return result;
    }
    case ASTNodeType.FUNCTION: {
      const identifier = node.identifier.identifier.value;

      if (node.param2 === null) {
        const op = (operand: any) => {
          const locals = createEnvironment(env);
          locals.vars[node.param1.identifier.value] = operand;
          return visit(node.body, locals, { isFunctionContext: true });
        };
        op.toString = () => uneval(node, { splitLines: true });
        op[Symbol.toStringTag] = op.toString;
        env.unaryOp[identifier] = op;

        return ok(env.unaryOp[identifier]);
      }

      const op = (left: any, right: any) => {
        const locals = createEnvironment(env);
        locals.vars[node.param1.identifier.value] = left;
        locals.vars[node.param2!.identifier.value] = right;
        return visit(node.body, locals, { isFunctionContext: true });
      };
      op.toString = () => uneval(node, { splitLines: true });
      op[Symbol.toStringTag] = op.toString;
      env.binaryOp[identifier] = op;

      return ok(env.binaryOp[identifier]);
    }
    case ASTNodeType.IF: {
      if (!isComposedIfNode(node)) {
        throw new Error("panic: unexpected uncomposed IfNode");
      }

      const condition = visit(node.condition, env, state);

      if (condition.isErr()) {
        return condition;
      }

      if (condition.unwrap()) {
        return visit(node.body, env, state);
      }

      for (let i = 0; i < node.elif.length; i++) {
        const elif = node.elif[i];
        const body = elif.body;

        if (body.type === ASTNodeType.IF) {
          const condition = visit(body.condition, env, state);

          if (condition.isErr()) {
            return condition;
          }

          if (condition.unwrap()) {
            return visit(body.body, env, state);
          }
          continue;
        }

        return visit(body, env, state);
      }

      return ok(null);
    }
    case ASTNodeType.IDENTIFIER:
      return ok(null);
    case ASTNodeType.NUMERIC_LITERAL:
      if (!isNumericLiteralNode(node)) {
        throw new Error("panic: expected NumericLiteralNode");
      }
      return ok(node.value);
    case ASTNodeType.RETURN: {
      if (typeof state === "undefined" || !state.isFunctionContext) {
        return err({
          message: "return statement outside of function",
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "SyntaxError",
        });
      }

      const value = visit(node.value, env, state);

      if (value.isErr()) {
        return value;
      }

      state.toReturn = true;

      return ok(value.unwrap());
    }
    case ASTNodeType.STRING_LITERAL:
      if (!isStringLiteralNode(node)) {
        throw new Error("panic: expected StringLiteralNode");
      }
      return ok(node.value);
    case ASTNodeType.IMPERATIVE:
      return visit(node.value, env, state);
    case ASTNodeType.SENTENCE_LIST: {
      let result: Either<any, QuaesitumError> = ok(null);

      for (let i = 0; i < node.sentences.length; i++) {
        result = visit(node.sentences[i], env, state);

        if (
          result.isErr() ||
          state?.toReturn ||
          state?.toBreak ||
          state?.toContinue
        ) {
          return result;
        }
      }

      return result;
    }
    case ASTNodeType.VARIABLE_DECLARATION: {
      const identifier = node.identifier.identifier.value;
      if (identifier in constants) {
        return err({
          message: `Cannot redeclare built-in variable: '${identifier}'`,
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "SyntaxError",
        });
      }

      env.vars[identifier] = undefined;

      return ok(null);
    }
    case ASTNodeType.WHILE: {
      let result: Either<any, QuaesitumError> = ok(null);

      while (true) {
        const condition = visit(node.condition, env, state);

        if (condition.isErr()) {
          return condition;
        }

        if (!condition.unwrap()) {
          break;
        }

        result = visit(node.body, env, state);

        if (result.isErr() || state?.toReturn || state?.toBreak) {
          return result;
        }
      }

      return result;
    }
    case ASTNodeType.UNARY_OP: {
      if (!isUnaryOpNode(node)) {
        throw new Error("panic: expected UnaryOpNode");
      }

      const operand = visit(node.operand, env, state);

      if (operand.isErr()) {
        return operand;
      }

      const op = lookupWithTokenType(
        node.operator.value,
        env,
        TokenType.SPECIAL_TOKEN_UNARY_OP
      );

      if (op.isErr()) {
        return err({
          message: op.unwrapErr(),
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "NameError",
        });
      }

      return op.unwrap()(operand.value);
    }
    case ASTNodeType.VARIABLE: {
      if (!isVariableNode(node)) {
        throw new Error("panic: expected VariableNode");
      }
      const identifier = node.identifier.value;
      const result = lookupWithTokenType(identifier, env, node.identifier.type);

      if (result.isErr()) {
        return err({
          message: result.unwrapErr(),
          lineno: node.lineno,
          column: node.column,
          file: node.file,
          type: "NameError",
        });
      }

      return ok(result.unwrap());
    }
  }
}

export function execute(
  node: ProgramNode,
  env?: Environment
): Either<any, QuaesitumError> {
  const root = createEnvironment();
  root.binaryOp = binaryOps;
  root.unaryOp = unaryOps;
  root.vars = constants;

  return visit(node, env ?? createEnvironment(root), {});
}
