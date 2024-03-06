import { Lexer, TokenType } from ".";

const lexer = new Lexer();

test("test tokenization: create a variable", function () {
  const tokens = lexer.tokenize("crea variabile x.");

  expect(tokens.isOk()).toBe(true);

  if (tokens.isErr()) {
    // never reaches here
    throw null;
  }

  expect(tokens.value.length).toBe(4);
  expect(tokens.value[0].type).toBe(TokenType.CREATE);
  expect(tokens.value[1].type).toBe(TokenType.VARIABLE);
  expect(tokens.value[2].type).toBe(TokenType.IDENTIFIER);
  expect(tokens.value[2].value).toBe("x");
  expect(tokens.value[3].type).toBe(TokenType.END_OF_SENTENCE);
});
