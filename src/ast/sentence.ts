import {
  BinaryOpToken,
  SpecialToken,
  UnaryOpToken,
  VariableToken,
} from "../lexer";
import { ASTNodeBase, ASTNodeType } from "./astNode";
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

export interface IdentifierNode extends ASTNodeBase {
  type: ASTNodeType.IDENTIFIER;
  identifier: SpecialToken;
}

export interface SentenceListNode extends ASTNodeBase {
  type: ASTNodeType.SENTENCE_LIST;
  sentences: SentenceNode[];
}

export interface VariableDeclarationNode extends ASTNodeBase {
  type: ASTNodeType.VARIABLE_DECLARATION;
  identifier: IdentifierNode;
}

export interface ImperativeNode extends ASTNodeBase {
  type: ASTNodeType.IMPERATIVE;
  value: ExpressionNode;
}

export interface AssignmentNode extends ASTNodeBase {
  type: ASTNodeType.ASSIGNMENT;
  identifier: IdentifierNode;
  value: ExpressionNode;
}

export interface IfNode extends ASTNodeBase {
  type: ASTNodeType.IF;
  condition: ExpressionNode;
  body: SentenceListNode;
}

export interface ElseNode extends ASTNodeBase {
  type: ASTNodeType.ELSE;
  body: SentenceListNode | IfNode;
}

export interface ComposedIfNode extends IfNode {
  composed: true;
  elif: ElseNode[];
}

export function isComposedIfNode(node: IfNode): node is ComposedIfNode {
  return "composed" in node;
}

export interface ForNode extends ASTNodeBase {
  type: ASTNodeType.FOR;
  variable: IdentifierNode;
  from: ExpressionNode;
  to: ExpressionNode;
  body: SentenceListNode;
}

export interface WhileNode extends ASTNodeBase {
  type: ASTNodeType.WHILE;
  condition: ExpressionNode;
  body: SentenceListNode;
}

export interface FunctionNode extends ASTNodeBase {
  type: ASTNodeType.FUNCTION;
  identifier: IdentifierNode;
  param1: IdentifierNode;
  param2: IdentifierNode | null;
  body: SentenceListNode;
}

export interface ReturnNode extends ASTNodeBase {
  type: ASTNodeType.RETURN;
  value: ExpressionNode;
}

export interface CommentNode extends ASTNodeBase {
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
