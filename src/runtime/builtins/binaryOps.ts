import { QuaesitumError } from "../../errors";
import { Either, Ok, err, ok } from "../../util/either";
import { Thesaurus, setBuiltinOperatorProperties } from "../internal/utils";

export function adde(a: number, b: number): Ok<number> {
  return ok(a + b);
}

export function subtrahe(a: number, b: number): Ok<number> {
  return ok(a - b);
}

export function multiplicet(a: number, b: number): Ok<number> {
  return ok(a * b);
}

export function divide(a: number, b: number): Ok<number> {
  return ok(a / b);
}

export function modulo(a: number, b: number): Ok<number> {
  return ok(a % b);
}

export function aequat(a: any, b: any): Ok<number> {
  return ok(a === b ? 1 : 0);
}

export function ultra(a: any, b: any): Ok<number> {
  return ok(a > b ? 1 : 0);
}

export function infra(a: any, b: any): Ok<number> {
  return ok(a < b ? 1 : 0);
}

export function vel(a: any, b: any): Ok<number> {
  return ok(a || b);
}

export function neque(a: any, b: any): Ok<number> {
  return ok(a && b);
}

export function compone(a: any, b: any): Ok<any> {
  return ok([a, b]);
}

export function pone(a: any, b: any): Either<any, QuaesitumError> {
  if (!Array.isArray(b)) {
    return err({
      type: "TypeError",
      message: "key-value pair expected",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  if (typeof a === "string") {
    return err({
      type: "TypeError",
      message: "Cannot mutate a string this way",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  if (typeof a !== "object" && !Array.isArray(a)) {
    return err({
      type: "TypeError",
      message: "Cannot assign to a non-thesaurus or non-array object.",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  if (a instanceof Thesaurus) {
    return a.set(b);
  }

  const [key, value] = b;

  if (
    typeof a === "object" &&
    typeof key !== "string" &&
    typeof key !== "number"
  ) {
    return err({
      type: "TypeError",
      message: "Key must be a string or a number",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  } else if (typeof key !== "number") {
    return err({
      type: "TypeError",
      message: "Array index must be a number",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  a[key] = value;
  return ok(a);
}

export function para(a: any, b: any): Either<any, QuaesitumError> {
  if (typeof a !== "object" && typeof a !== "string" && !Array.isArray(a)) {
    return err({
      type: "TypeError",
      message:
        "Cannot get value from a non-thesaurus, non-array or non-string object.",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  if (a instanceof Thesaurus) {
    return a.get(b);
  }

  if (typeof a === "object" && typeof b !== "string" && typeof b !== "number") {
    return err({
      type: "TypeError",
      message: "Key must be a string or a number",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  } else if (typeof b !== "number") {
    return err({
      type: "TypeError",
      message: "Array or string index must be a number",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  return ok(a[b] ?? null);
}

export function dele(a: any, b: any): Either<any, QuaesitumError> {
  if (typeof b !== "string" && typeof b !== "number") {
    return err({
      type: "TypeError",
      message: "Key must be a string or a number",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  if (!(a instanceof Thesaurus)) {
    return err({
      type: "TypeError",
      message: "Cannot delete from a non-thesaurus object.",
      lineno: 1,
      column: 1,
      file: "<builtins>",
    });
  }

  return a.del(b);
}

export function habetne(a: any, b: any): Either<boolean, QuaesitumError> {
  if (a instanceof Thesaurus) {
    return ok(a.has(b));
  }

  if (Array.isArray(a)) {
    return ok(a.includes(b));
  }

  return ok(false);
}

setBuiltinOperatorProperties(adde, {
  arity: 2,
  description: "Adds two numbers or concatenates two strings",
  param1: {
    name: "a",
    description: "The first number or string",
  },
  param2: {
    name: "b",
    description: "The second number or string",
  },
});

setBuiltinOperatorProperties(subtrahe, {
  arity: 2,
  description: "Subtracts two numbers",
  param1: {
    name: "a",
    description: "The first number",
  },
  param2: {
    name: "b",
    description: "The second number",
  },
});

setBuiltinOperatorProperties(multiplicet, {
  arity: 2,
  description: "Multiplies two numbers",
  param1: {
    name: "a",
    description: "The first number",
  },
  param2: {
    name: "b",
    description: "The second number",
  },
});

setBuiltinOperatorProperties(divide, {
  arity: 2,
  description: "Divides two numbers",
  param1: {
    name: "a",
    description: "The first number",
  },
  param2: {
    name: "b",
    description: "The second number",
  },
});

setBuiltinOperatorProperties(modulo, {
  arity: 2,
  description: "Gets the remainder of a division",
  param1: {
    name: "a",
    description: "The first number",
  },
  param2: {
    name: "b",
    description: "The second number",
  },
});

setBuiltinOperatorProperties(aequat, {
  arity: 2,
  description: "Checks if two values are equal",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(ultra, {
  arity: 2,
  description: "Checks if the first value is greater than the second",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(infra, {
  arity: 2,
  description: "Checks if the first value is less than the second",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(vel, {
  arity: 2,
  description: "Checks if either of the two values is true",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(neque, {
  arity: 2,
  description: "Checks if both values are true",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(compone, {
  arity: 2,
  description: "Combines two values into a pair",
  param1: {
    name: "a",
    description: "The first value",
  },
  param2: {
    name: "b",
    description: "The second value",
  },
});

setBuiltinOperatorProperties(pone, {
  arity: 2,
  description: "Mutates an object or array",
  param1: {
    name: "a",
    description: "The object or array",
  },
  param2: {
    name: "b",
    description: "The key-value pair",
  },
});

setBuiltinOperatorProperties(para, {
  arity: 2,
  description: "Gets a value from an object or array",
  param1: {
    name: "a",
    description: "The object or array",
  },
  param2: {
    name: "b",
    description: "The key or index",
  },
});

setBuiltinOperatorProperties(dele, {
  arity: 2,
  description: "Deletes a value from an object or array",
  param1: {
    name: "a",
    description: "The object or array",
  },
  param2: {
    name: "b",
    description: "The key or index",
  },
});

setBuiltinOperatorProperties(habetne, {
  arity: 2,
  description: "Checks if an object or array has a key or value",
  param1: {
    name: "a",
    description: "The object or array",
  },
  param2: {
    name: "b",
    description: "The key or value",
  },
});
