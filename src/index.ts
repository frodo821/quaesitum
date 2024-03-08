import { execFile } from "./runtime/interpreter";

execFile(process.argv[2]).then((it) => process.exit(it));
