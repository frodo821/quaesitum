import { Lexer } from "./lexer";
import { Parser } from "./parse/parser";
import { execute } from "./runtime/interpreter";

const lexer = new Lexer();
const input = `nota @test this is a comment crea variabilis.
crea variabilis numerus.
per numerus ab 1 ad 100 face
  si 0 aequat numerus modulo 15 tum
    scribe "FizzBuzz",
  huc finis est, aliter si 0 aequat numerus modulo 3 tum
    scribe "Fizz".
  huc finis est, aliter si 0 aequat numerus modulo 5 tum
    scribe "Buzz".
  huc finis est, aliter tum
    scribe numerus.
  huc finis est,
huc finis est.
`;
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
    console.log(e.unwrap());
  }
} else {
  const { column, file, lineno, message, type } = result.error;

  console.error(
    `${type}: ${message} at line ${lineno}, column ${column} in file ${file}.`
  );
}
