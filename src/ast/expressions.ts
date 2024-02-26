import { BinaryOpToken, Token, UnaryOpToken, VariableToken } from "../lexer";
import { ASTNode, ASTNodeType } from "./astNode";

export type ExpressionType =
  | ASTNodeType.BINARY_OP
  | ASTNodeType.UNARY_OP
  | ASTNodeType.NUMERIC_LITERAL
  | ASTNodeType.STRING_LITERAL
  | ASTNodeType.VARIABLE;

export interface ExpressionNode extends ASTNode {
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
