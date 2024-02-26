import {
  ExpressionNode,
  ExpressionType,
  BinaryOpNode,
  UnaryOpNode,
  NumericLiteralNode,
  StringLiteralNode,
  VariableNode,
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
} from "./sentence";
import { ProgramNode } from "./program";

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
  | IfNode
  | ElseNode
  | ForNode
  | WhileNode
  | ProgramNode;
