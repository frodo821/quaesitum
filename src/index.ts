import { showError } from "./errors";
import { Lexer } from "./lexer";
import { Parser } from "./parse/parser";
import { execute } from "./runtime/interpreter";
import { readFileSync } from "fs";
import { resolve } from "path";

async function execFile(path: string) {
  path = resolve(path);
  const src = readFileSync(path, "utf-8");
  const lexer = new Lexer();
  const tokens = lexer.tokenize(src, path);

  if (tokens.isErr()) {
    showError(tokens.unwrapErr());
    return -3;
  }

  const parser = new Parser();
  const program = parser.feed(tokens.value, path);

  if (program.isErr()) {
    showError(program.unwrapErr());
    return -2;
  }

  const asts = program.value;
  const result = await execute(asts, path);

  if (result.isErr()) {
    showError(result.unwrapErr());
    return -1;
  }

  return 0;
}

execFile(process.argv[2]).then((it) => process.exit(it));
