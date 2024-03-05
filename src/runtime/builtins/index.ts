import * as binaryOps from "./binaryOps";
import * as unaryOps from "./unaryOps";
import * as constants from "./constants";

export * as binaryOps from "./binaryOps";
export * as unaryOps from "./unaryOps";
export * as constants from "./constants";

export const builtInNames = {
  unaryOp: Object.keys(unaryOps),
  binaryOp: Object.keys(binaryOps),
  vars: Object.keys(constants),
} as const;
