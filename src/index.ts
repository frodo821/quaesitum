import { Lexer } from "./lexer";
import { Parser } from "./parse/parser";

const lexer = new Lexer();
// const input = `define fibonacci cum n face
//   si n infra 2 tum
//     redi 1.
//   huc finis est.

//   crea variabilis a.
//   crea variabilis b.

//   da a n subtrahe 1.
//   da a fibonacci a.
//   da b n subtrahe 2.
//   da b fibonacci b.

//   redi a adde b.
// huc finis est.

// scribe fibonacci 0.`;
const input = `crea variabilis numerus.
per numerus ab 1 ad 100 face
  si numerus modulo 15 aequat 0 tum
    scribe "FizzBuzz".
  huc finis est. aliter si numerus modulo 3 aequat 0 tum
    scribe "Fizz".
  huc finis est. aliter si numerus modulo 5 aequat 0 tum
    scribe "Buzz".
  huc finis est. aliter tum
    scribe numerus.
  huc finis est.
huc finis est.
`;
const tokens = lexer.tokenize(input, "<test>");
const parser = new Parser();
const result = parser.feed(tokens);

if (result.isOk()) {
  console.log(JSON.stringify(result.value));
} else {
  const { column, file, lineno, message, type } = result.error;

  console.error(
    `${type}: ${message} at line ${lineno}, column ${column} in file ${file}.`
  );
}
