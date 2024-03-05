import { Ok, ok } from "../../util/either";

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
