import { ProgramNode } from "../ast";
import { showError } from "../errors";
import { Lexer } from "../lexer";
import { Parser } from "../parse/parser";
import { unaryOps } from "./builtins";
import { Environment, Executor } from "./interpreter";

export default class REPL {
  nodes: Record<string, ProgramNode> = {};
  executor: Executor;
  lexer: Lexer;
  parser: Parser;
  globals: Environment;

  constructor() {
    this.executor = new Executor({});
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.globals = this.executor.initGlobals();
  }

  async feed(str: string): Promise<boolean> {
    const tokens = this.lexer.tokenize(str, "<stdin>");

    if (tokens.isErr()) {
      showError(tokens.error);
      return true;
    }

    const completed = this.parser.checkCompleted(tokens.value);

    if (completed.isErr()) {
      showError(completed.error);
      return true;
    }

    if (!completed.value) {
      return false;
    }

    const parsed = this.parser.partialFeed(tokens.value, "<stdin>");

    if (parsed.isErr()) {
      showError(parsed.error);
      return true;
    }

    this.executor.trees = {
      ...this.executor.trees,
      ...parsed.value,
    };

    const result = await this.executor.enter("<stdin>", this.globals);

    if (result.isErr()) {
      showError(result.error);
      return true;
    }

    console.log(`=> ${result.value ?? null}`);
    return true;
  }
}
