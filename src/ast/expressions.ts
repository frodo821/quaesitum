import { BinaryOpToken, Token, UnaryOpToken, VariableToken } from "../lexer";
import { ASTNodeBase, ASTNodeType } from "./astNode";

export type ExpressionType =
  | ASTNodeType.BINARY_OP
  | ASTNodeType.UNARY_OP
  | ASTNodeType.NUMERIC_LITERAL
  | ASTNodeType.STRING_LITERAL
  | ASTNodeType.VARIABLE;

export interface ExpressionNode extends ASTNodeBase {
  type: ExpressionType;
}

export interface BinaryOpNode extends ExpressionNode {
  type: ASTNodeType.BINARY_OP;
  operator: BinaryOpToken;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryOpNode extends ExpressionNode {
  type: ASTNodeType.UNARY_OP;
  operator: UnaryOpToken;
  operand: ExpressionNode;
}

export interface NumericLiteralNode extends ExpressionNode {
  type: ASTNodeType.NUMERIC_LITERAL;
  representation: Token;
  value: number;
}

export interface StringLiteralNode extends ExpressionNode {
  type: ASTNodeType.STRING_LITERAL;
  representation: Token;
  value: string;
}

export interface VariableNode extends ExpressionNode {
  type: ASTNodeType.VARIABLE;
  identifier: VariableToken;
}

export function isBinaryOpNode(node: ExpressionNode): node is BinaryOpNode {
  return node.type === ASTNodeType.BINARY_OP;
}

export function isUnaryOpNode(node: ExpressionNode): node is UnaryOpNode {
  return node.type === ASTNodeType.UNARY_OP;
}

export function isNumericLiteralNode(
  node: ExpressionNode
): node is NumericLiteralNode {
  return node.type === ASTNodeType.NUMERIC_LITERAL;
}

export function isStringLiteralNode(
  node: ExpressionNode
): node is StringLiteralNode {
  return node.type === ASTNodeType.STRING_LITERAL;
}

export function isVariableNode(node: ExpressionNode): node is VariableNode {
  return node.type === ASTNodeType.VARIABLE;
}
