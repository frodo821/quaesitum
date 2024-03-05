import { Lexer } from "./lexer";
import { Parser } from "./parse/parser";
import { execute } from "./runtime/interpreter";

const lexer = new Lexer();
const input = `define fibonacci cum n face
  si n infra 2 tum
    redi 1.
  huc finis est.

  crea variabilis a.
  crea variabilis b.

  da a n subtrahe 1.
  da a fibonacci a.
  da b n subtrahe 2.
  da b fibonacci b.

  redi a adde b.
huc finis est.

scribe fibonacci 4.
crea variabilis a.
da a fibonacci.
scribe a.

define foo cum n et m face
  da n n adde m.
  scribe n.
huc finis est.

1 foo 2.`;
const tokens = lexer.tokenize(input, "<test>");
const parser = new Parser();
const result = parser.feed(tokens);

if (result.isOk()) {
  const e = execute(result.unwrap());

  if (e.isErr()) {
    const { column, file, lineno, message, type } = e.error;
    console.error(
      `${type}: ${message} at line ${lineno}, column ${column} in file ${file}.`
    );
  }

  if (e.isOk()) {
    console.log(e.unwrap()?.toString() ?? "null");
  }
} else {
  const { column, file, lineno, message, type } = result.error;

  console.error(
    `${type}: ${message} at line ${lineno}, column ${column} in file ${file}.`
  );
}
