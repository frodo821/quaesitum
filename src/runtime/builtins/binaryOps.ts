// "adde", "subtrahe", "multiplicet", "divide", "modulo", "aequat", "ultra", "infra", "vel", "neque",

import { Ok, ok } from "../../util/either";

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
