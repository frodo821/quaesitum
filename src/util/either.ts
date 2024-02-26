interface Instance<out T, out E> {
  map: <U>(f: (value: T) => U) => Either<U, E>;
  mapErr: <F>(f: (error: E) => F) => Either<T, F>;
  isOk: () => this is Ok<T>;
  isErr: () => this is Err<E>;
  unwrap: () => T;
  unwrapErr: () => E;
  expect: (message: string) => T;
  expectErr: (message: string) => E;
  unwrapOrNull: () => T | null;
}
export interface Ok<out T> extends Instance<T, never> {
  ok: true;
  value: T;
}
export interface Err<out T> extends Instance<never, T> {
  ok: false;
  error: T;
}
export type Either<T, E> = Ok<T> | Err<E>;

function _construct<T, E = never>(
  setOk: true,
  value: T,
  error: undefined
): Ok<T>;
function _construct<T = never, E = any>(
  setOk: false,
  value: undefined,
  error: E
): Err<E>;
function _construct<T = any, E = any>(
  setOk: boolean,
  value: T | undefined,
  error: E | undefined
): Either<T, E> {
  return {
    map(fn: any) {
      return this.isOk() ? ok(fn(this.unwrap())) : this;
    },
    mapErr(fn: any) {
      return this.isErr() ? err(fn(this.unwrapErr())) : this;
    },
    isOk() {
      return setOk;
    },
    isErr() {
      return !setOk;
    },
    unwrap() {
      if (setOk) {
        return value;
      }
      throw new Error("Called unwrap on an Err value");
    },
    unwrapErr() {
      if (!setOk) {
        return error;
      }
      throw new Error("Called unwrapErr on an Ok value");
    },
    expect(message: string) {
      if (setOk) {
        return value;
      }
      throw new Error(message);
    },
    expectErr(message: string) {
      if (!setOk) {
        return error;
      }
      throw new Error(message);
    },
    unwrapOrNull() {
      return setOk ? value : null;
    },
    get ok() {
      return setOk;
    },
    get value() {
      return value;
    },
    get error() {
      return error;
    },
  } as any as Either<T, E>;
}

export function ok<T>(value: T): Ok<T> {
  return _construct(true, value, undefined);
}

export function err<T>(error: T): Err<T> {
  return _construct(false, undefined, error);
}
