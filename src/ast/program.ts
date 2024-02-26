import { ASTNodeBase, ASTNodeType } from "./astNode";
import { SentenceListNode } from "./sentence";

export interface ProgramNode extends ASTNodeBase {
  type: ASTNodeType.PROGRAM;
  program: SentenceListNode;
}
