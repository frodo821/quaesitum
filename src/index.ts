import { QuaesitumError } from "./errors";
import { Lexer } from "./lexer";
import { Parser } from "./parse/parser";
import { execute } from "./runtime/interpreter";
import { readFileSync } from "fs";

function showError(err: QuaesitumError) {
  console.error(
    `${err.type}: ${err.message} at line ${err.lineno}, column ${
      err.column
    } in ${err.file ?? "<anonymous>"}`
  );
}

function execFile(path: string) {
  const src = readFileSync(path, "utf-8");
  const lexer = new Lexer();
  const tokens = lexer.tokenize(src, path);
  const parser = new Parser();
  const program = parser.feed(tokens);

  if (program.isErr()) {
    showError(program.unwrapErr());
    return -2;
  }

  const result = execute(program.unwrap());

  if (result.isErr()) {
    showError(result.unwrapErr());
    return -1;
  }

  return 0;
}

process.exit(execFile(process.argv[2]));
