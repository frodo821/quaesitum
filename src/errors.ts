export interface QuaesitumError {
  type: string;
  message: string;
  lineno: number;
  column: number;
  file?: string;
}
