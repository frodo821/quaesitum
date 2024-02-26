import * as binaryOps from "./binaryOps";
import * as unaryOps from "./unaryOps";
import * as constants from "./constants";

export * from "./binaryOps";
export * from "./unaryOps";
export * from "./constants";

export const builtInNames = {
  unaryOp: Object.keys(unaryOps),
  binaryOp: Object.keys(binaryOps),
  vars: Object.keys(constants),
} as const;
