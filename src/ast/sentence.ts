import {
  BinaryOpToken,
  SpecialToken,
  UnaryOpToken,
  VariableToken,
} from "../lexer";
import { ASTNode, ASTNodeType } from "./astNode";
import { ExpressionNode } from "./expressions";

export type SentenceType =
  | ASTNodeType.VARIABLE_DECLARATION
  | ASTNodeType.ASSIGNMENT
  | ASTNodeType.IMPERATIVE
  | ASTNodeType.IF
  | ASTNodeType.ELSE
  | ASTNodeType.FOR
  | ASTNodeType.WHILE
  | ASTNodeType.FUNCTION
  | ASTNodeType.RETURN
  | ASTNodeType.COMMENT;

export interface IdentifierNode extends ASTNode {
  type: ASTNodeType.IDENTIFIER;
  identifier: SpecialToken;
}

export interface SentenceListNode extends ASTNode {
  type: ASTNodeType.SENTENCE_LIST;
  sentences: SentenceNode[];
}

export interface VariableDeclarationNode {
  type: ASTNodeType.VARIABLE_DECLARATION;
  identifier: IdentifierNode;
}

export interface ImperativeNode {
  type: ASTNodeType.IMPERATIVE;
  value: ExpressionNode;
}

export interface AssignmentNode {
  type: ASTNodeType.ASSIGNMENT;
  identifier: IdentifierNode;
  value: ExpressionNode;
}

export interface IfNode {
  type: ASTNodeType.IF;
  condition: ExpressionNode;
  body: SentenceListNode;
}

export interface ElseNode {
  type: ASTNodeType.ELSE;
  body: SentenceListNode | IfNode;
}

export interface ForNode {
  type: ASTNodeType.FOR;
  variable: IdentifierNode;
  from: ExpressionNode;
  to: ExpressionNode;
  body: SentenceListNode;
}

export interface WhileNode {
  type: ASTNodeType.WHILE;
  condition: ExpressionNode;
  body: SentenceListNode;
}

export interface FunctionNode {
  type: ASTNodeType.FUNCTION;
  identifier: IdentifierNode;
  param1: IdentifierNode;
  param2: IdentifierNode | null;
  body: SentenceListNode;
}

export interface ReturnNode {
  type: ASTNodeType.RETURN;
  value: ExpressionNode;
}

export interface CommentNode {
  type: ASTNodeType.COMMENT;
  value: string;
}

export type SentenceNode =
  | VariableDeclarationNode
  | AssignmentNode
  | ImperativeNode
  | IfNode
  | ElseNode
  | ForNode
  | WhileNode
  | FunctionNode
  | ReturnNode
  | CommentNode;
