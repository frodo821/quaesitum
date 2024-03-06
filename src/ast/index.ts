import {
  ExpressionNode,
  ExpressionType,
  BinaryOpNode,
  UnaryOpNode,
  NumericLiteralNode,
  StringLiteralNode,
  VariableNode,
  isBinaryOpNode,
  isUnaryOpNode,
  isNumericLiteralNode,
  isStringLiteralNode,
  isVariableNode,
} from "./expressions";
import {
  SentenceType,
  IdentifierNode,
  SentenceListNode,
  SentenceNode,
  VariableDeclarationNode,
  AssignmentNode,
  IfNode,
  ElseNode,
  ForNode,
  WhileNode,
  ComposedIfNode,
} from "./sentence";
import { ProgramNode } from "./program";
import { ASTNodeType, EmptyNode } from "./astNode";

export { ASTNodeBase, ASTNodeType, Token, TokenType } from "./astNode";

export {
  ProgramNode,
  ExpressionNode,
  ExpressionType,
  BinaryOpNode,
  UnaryOpNode,
  NumericLiteralNode,
  StringLiteralNode,
  VariableNode,
  SentenceType,
  IdentifierNode,
  SentenceListNode,
  SentenceNode,
  VariableDeclarationNode,
  AssignmentNode,
  IfNode,
  ElseNode,
  ForNode,
  WhileNode,
};

export type ASTNode =
  | ExpressionNode
  | BinaryOpNode
  | UnaryOpNode
  | NumericLiteralNode
  | StringLiteralNode
  | VariableNode
  | IdentifierNode
  | SentenceListNode
  | SentenceNode
  | VariableDeclarationNode
  | AssignmentNode
  | ComposedIfNode
  | ElseNode
  | ForNode
  | WhileNode
  | ProgramNode
  | EmptyNode;

export function expressionToString(node: ExpressionNode): string {
  switch (node.type) {
    case ASTNodeType.BINARY_OP: {
      if (!isBinaryOpNode(node)) {
        throw new Error("panic: expected BinaryOpNode");
      }
      return `${expressionToString(node.left)} ${
        node.operator.value
      } ${expressionToString(node.right)}`;
    }
    case ASTNodeType.UNARY_OP: {
      if (!isUnaryOpNode(node)) {
        throw new Error("panic: expected UnaryOpNode");
      }
      return `${node.operator.value} ${expressionToString(node.operand)}`;
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
      return node.identifier.value;
    }
  }
}

type UnevalOptions = {
  splitLines?: boolean;
  indent?: number | string;
};

export function uneval(
  node: ASTNode,
  opt?: UnevalOptions,
  depth: number = 0
): string {
  const lf = opt?.splitLines ? "\n" : " ";
  const indent = (
    opt?.splitLines
      ? typeof opt.indent === "number"
        ? " ".repeat(opt.indent)
        : opt.indent ?? "  "
      : ""
  ).repeat(depth);

  switch (node.type) {
    case ASTNodeType.VARIABLE_DECLARATION: {
      return `crea variabile ${node.identifier.identifier.value}.`;
    }
    case ASTNodeType.ASSIGNMENT: {
      return `da ${node.identifier.identifier.value} ${expressionToString(
        node.value
      )}.`;
    }
    case ASTNodeType.IF: {
      return `si ${expressionToString(node.condition)} tum${lf}${uneval(
        node.body,
        opt,
        depth + 1
      )}${lf}${indent}huc finis est.`;
    }
    case ASTNodeType.ELSE: {
      return `aliter ${uneval(
        node.body,
        opt,
        depth + 1
      )}${lf}${indent}huc finis est.`;
    }
    case ASTNodeType.SENTENCE_LIST: {
      return (
        `${indent}` +
        node.sentences
          .map((it) => uneval(it, opt, depth))
          .join(`${lf}${indent}`)
      );
    }
    case ASTNodeType.PROGRAM: {
      return uneval(node.program, opt, depth).trimStart();
    }
    case ASTNodeType.FOR: {
      return `par ${node.variable.identifier.value} ab ${expressionToString(
        node.from
      )} ad ${expressionToString(node.to)} tum${lf}${uneval(
        node.body,
        opt,
        depth + 1
      )}${lf}${indent}huc finis est.`;
    }
    case ASTNodeType.WHILE: {
      return `dum ${expressionToString(node.condition)} tum${lf}${uneval(
        node.body,
        opt,
        depth + 1
      )}${lf}${indent}huc finis est.`;
    }
    case ASTNodeType.EMPTY: {
      return "";
    }
    case ASTNodeType.FUNCTION: {
      if (node.param2 === null) {
        return `define ${node.identifier.identifier.value} cum ${
          node.param1.identifier.value
        } face${lf}${uneval(
          node.body,
          opt,
          depth + 1
        )}${lf}${indent}huc finis est.`;
      }
      return `define ${node.identifier.identifier.value} cum ${
        node.param1.identifier.value
      } et ${node.param2.identifier.value} face${lf}${uneval(
        node.body,
        opt,
        depth + 1
      )}${lf}${indent}huc finis est.`;
    }
    case ASTNodeType.RETURN: {
      return `redi ${expressionToString(node.value)}.`;
    }
    case ASTNodeType.COMMENT: {
      return `nota ${node.value}.`;
    }
    case ASTNodeType.IMPERATIVE: {
      return `${expressionToString(node.value)}.`;
    }
    case ASTNodeType.BINARY_OP: {
      return expressionToString(node);
    }
    case ASTNodeType.UNARY_OP: {
      return expressionToString(node);
    }
    case ASTNodeType.NUMERIC_LITERAL: {
      return expressionToString(node);
    }
    case ASTNodeType.STRING_LITERAL: {
      return expressionToString(node);
    }
    case ASTNodeType.VARIABLE: {
      return expressionToString(node);
    }
    case ASTNodeType.IDENTIFIER: {
      return node.identifier.value;
    }
    case ASTNodeType.IMPORT: {
      return `profer ${node.identifier.identifier.value} ab "${node.path}".`;
    }
    default:
      return "";
  }
}
