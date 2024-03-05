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
      return `${node.operator.value}${expressionToString(node.operand)}`;
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
