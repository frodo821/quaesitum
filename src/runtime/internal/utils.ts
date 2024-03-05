import { QuaesitumError } from "../../errors";
import { Either, err, ok } from "../../util/either";

export class Thesaurus {
  private thesaurus: { [key: string | number]: any };

  constructor() {
    this.thesaurus = Object.create(null);
  }

  static create(obj: object) {
    const thesaurus = new Thesaurus();
    Object.assign(thesaurus.thesaurus, obj);
    return thesaurus;
  }

  set(kv: any): Either<Thesaurus, QuaesitumError> {
    if (!Array.isArray(kv) || kv.length !== 2) {
      return err({
        type: "TypeError",
        message: "key-value pair expected",
        lineno: 1,
        column: 1,
        file: "<builtins>",
      });
    }

    const [key, value] = kv;

    if (typeof key !== "string" && typeof key !== "number") {
      return err({
        type: "TypeError",
        message: "key must be a string or a number",
        lineno: 1,
        column: 1,
        file: "<builtins>",
      });
    }

    this.thesaurus[key] = value;
    return ok(this);
  }

  get(key: any): Either<any, QuaesitumError> {
    if (typeof key !== "string" && typeof key !== "number") {
      return err({
        type: "TypeError",
        message: "key must be a string or a number",
        lineno: 1,
        column: 1,
        file: "<builtins>",
      });
    }

    if (this.thesaurus[key] === undefined) {
      return err({
        type: "ReferenceError",
        message: `key ${key} does not exist`,
        lineno: 1,
        column: 1,
        file: "<builtins>",
      });
    }

    return ok(this.thesaurus[key]);
  }

  del(key: any): Either<boolean, QuaesitumError> {
    if (typeof key !== "string" && typeof key !== "number") {
      return err({
        type: "TypeError",
        message: "key must be a string or a number",
        lineno: 1,
        column: 1,
        file: "<builtins>",
      });
    }

    return ok(delete this.thesaurus[key]);
  }

  copy(): Thesaurus {
    return Thesaurus.create(this.thesaurus);
  }

  get keys(): string[] {
    return Object.keys(this.thesaurus);
  }

  get length(): number {
    return Object.keys(this.thesaurus).length;
  }

  toString(depth = 1) {
    const toStringItems = ([k, v]: [string, any]): string => {
      if (v instanceof Thesaurus) {
        return `${k}: ${v.toString(depth + 1)}`;
      }
      return `${k}: ${v}`;
    };

    const indentation = "  ".repeat(depth);

    return `{\n${indentation}${Object.entries(this.thesaurus)
      .map(toStringItems)
      .join(`,\n${indentation}`)}
${"  ".repeat(depth - 1)}}`;
  }

  [Symbol.toStringTag] = this.toString.bind(this);
}

type Operand = {
  name: string;
  description: string;
};

type OperatorProperties =
  | {
      description: string;
      arity: 1;
      param1: Operand;
      param2?: never;
    }
  | {
      description: string;
      arity: 2;
      param1: Operand;
      param2: Operand;
    };

export function setBuiltinOperatorProperties(
  func: Function,
  props: OperatorProperties
) {
  Object.defineProperties(func, {
    description: {
      value: props.description,
      writable: false,
      enumerable: false,
      configurable: false,
    },
    arity: {
      value: props.arity,
      writable: false,
      enumerable: false,
      configurable: false,
    },
  });

  if (props.arity === 1) {
    const toString = () =>
      `define ${func.name} cum ${props.param1.name} face innatus. huc finis est.`;

    Object.defineProperties(func, {
      toString: {
        value: toString,
        writable: false,
        enumerable: false,
        configurable: false,
      },
      [Symbol.toStringTag]: {
        value: () => `<builtin operator ${func.name}/1>`,
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });
    return;
  }

  const toString = () =>
    `define ${func.name} cum ${props.param1.name} et ${props.param2.name} face innatus. huc finis est.`;

  Object.defineProperties(func, {
    toString: {
      value: toString,
      writable: false,
      enumerable: false,
      configurable: false,
    },
    [Symbol.toStringTag]: {
      value: () => `<builtin operator ${func.name}/2>`,
      writable: false,
      enumerable: false,
      configurable: false,
    },
  });
}
