import { ASTNode, ASTNodeType } from "./astNode";
import { SentenceListNode } from "./sentence";

export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  program: SentenceListNode;
}
