import { QuaesitumError } from "../../errors";
import { Either, Ok, err, ok } from "../../util/either";
import { Thesaurus, setBuiltinOperatorProperties } from "../internal/utils";

export function minus(a: number): Ok<number> {
  return ok(-a);
}

export function non(a: number): Ok<number> {
  return ok(a === 0 ? 1 : 0);
}

export function plus(a: number): Ok<number> {
  return ok(a);
}

export function scribe(a: any): Ok<null> {
  console.log(`${a}`);
  return ok(null);
}

export function crea_thesaurum(a: any): Ok<any> {
  return ok(new Thesaurus());
}

export function prior(a: any): Either<any, QuaesitumError> {
  if (Array.isArray(a)) {
    if (a.length === 0) {
      return ok(null);
    }
    return ok(a[0]);
  }

  return err({
    type: "TypeError",
    message: "Cannot get prior of a non-array",
    lineno: 1,
    column: 1,
    file: "<builtins>",
  });
}

export function posterior(a: any): Either<any, QuaesitumError> {
  if (Array.isArray(a)) {
    if (a.length === 0) {
      return ok(null);
    }
    return ok(a[a.length - 1]);
  }

  return err({
    type: "TypeError",
    message: "Cannot get posterior of a non-array",
    lineno: 1,
    column: 1,
    file: "<builtins>",
  });
}

export function claves(a: any): Either<string[], QuaesitumError> {
  if (!(a instanceof Thesaurus)) {
    return ok([]);
  }

  return ok(a.keys);
}

export function longitudo(a: any): Either<number, QuaesitumError> {
  if (typeof a === "string" || Array.isArray(a)) {
    return ok(a.length);
  }

  if (a instanceof Thesaurus) {
    return ok(a.length);
  }

  return err({
    type: "TypeError",
    message: "Cannot get length of a non-array or non-string",
    lineno: 1,
    column: 1,
    file: "<builtins>",
  });
}

export function duplica(a: any): Either<any, QuaesitumError> {
  if (Array.isArray(a)) {
    return ok([...a]);
  }

  if (a instanceof Thesaurus) {
    return ok(a.copy());
  }

  return ok(a);
}

setBuiltinOperatorProperties(minus, {
  arity: 1,
  description: "Negates a number",
  param1: {
    name: "a",
    description: "The number to negate",
  },
});

setBuiltinOperatorProperties(non, {
  arity: 1,
  description: "logical NOT of a value",
  param1: {
    name: "a",
    description: "The value to negate",
  },
});

setBuiltinOperatorProperties(plus, {
  arity: 1,
  description: "nothing to do and returns the value",
  param1: {
    name: "a",
    description: "The value to return",
  },
});

setBuiltinOperatorProperties(scribe, {
  arity: 1,
  description: "Prints the value to the console",
  param1: {
    name: "a",
    description: "The value to print",
  },
});

setBuiltinOperatorProperties(crea_thesaurum, {
  arity: 1,
  description: "Creates a new thesaurus",
  param1: {
    name: "a",
    description: "this value should be nullum because it is simply ignored.",
  },
});

setBuiltinOperatorProperties(prior, {
  arity: 1,
  description: "Returns the first element of a pair.",
  param1: {
    name: "a",
    description: "The pair",
  },
});

setBuiltinOperatorProperties(posterior, {
  arity: 1,
  description: "Returns the second element of a pair.",
  param1: {
    name: "a",
    description: "The pair",
  },
});

setBuiltinOperatorProperties(claves, {
  arity: 1,
  description: "Returns the keys of a thesaurus",
  param1: {
    name: "a",
    description: "The thesaurus",
  },
});

setBuiltinOperatorProperties(longitudo, {
  arity: 1,
  description: "Returns the length of a string, array or thesaurus",
  param1: {
    name: "a",
    description: "The string or array",
  },
});

setBuiltinOperatorProperties(duplica, {
  arity: 1,
  description: "Returns a copy of a value",
  param1: {
    name: "a",
    description: "value to copy",
  },
});
