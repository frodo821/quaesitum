export interface QuaesitumError {
  type: string;
  message: string;
  lineno: number;
  column: number;
  file?: string;
}

export interface ErrorGroup extends QuaesitumError {
  errors: QuaesitumError[];
  type: "ErrorGroup";
}

export function isErrorGroup(err: QuaesitumError): err is ErrorGroup {
  return err.type === "ErrorGroup";
}

export function showError(err: QuaesitumError) {
  if (isErrorGroup(err)) {
    for (let e of err.errors) {
      showError(e);
    }
    return;
  }

  console.error(
    `${err.type}: ${err.message} at line ${err.lineno}, column ${
      err.column
    } in ${err.file ?? "<anonymous>"}`
  );
}
