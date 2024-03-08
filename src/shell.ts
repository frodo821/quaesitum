import { createInterface } from "readline";
import REPL from "./runtime/interactive";
import { Keywords, TokenType } from "./lexer";
import c from "ansi-colors";

const commands = [".help", ".quit"] as const;
type Command = (typeof commands)[number];

function main() {
  console.log(
    `${c.whiteBright("welcome to the")} ${c.bold.greenBright(
      "Quaesitum"
    )} ${c.whiteBright("interactive shell!")}`
  );
  console.log('Type ".help" for a list of commands.');

  const repl = new REPL();

  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
    historySize: 1000,
    prompt: ">>> ",
    tabSize: 2,
    completer(input: string): [string[], string] {
      input = input.trim();

      if (input.startsWith(".")) {
        const hit = commands.filter((c) => c.startsWith(input));

        return [hit.length > 0 ? hit : [...commands], input];
      }

      const val = repl.lexer.tokenize(input, "<stdin>");

      if (val.isErr()) {
        return [[], input];
      }

      const tokens = val.value;
      const last = tokens[tokens.length - 1];
      const keys = [
        ...Keywords,
        ...Object.keys(repl.globals.binaryOp),
        ...Object.keys(repl.globals.unaryOp),
        ...Object.keys(repl.globals.vars),
        ...Object.keys(repl.globals.parent?.binaryOp ?? {}),
        ...Object.keys(repl.globals.parent?.unaryOp ?? {}),
        ...Object.keys(repl.globals.parent?.vars ?? {}),
      ];

      if (!last) {
        return [keys, input];
      }

      if (
        last.type === TokenType.IDENTIFIER ||
        last.type === TokenType.UNKNOWN
      ) {
        const hit = keys.filter((k) => k.startsWith(last.value));

        return [hit.length > 0 ? hit : keys, last.value];
      }

      if (last.type === TokenType.END_OF_SENTENCE) {
        const search = `${tokens[tokens.length - 2]?.value}.`;

        const hit = keys.filter((k) => k.startsWith(search));
        return [hit.length > 0 ? hit : keys, search];
      }

      return [[], input];
    },
  });

  let tmp = "";
  let sigint = false;
  process.stdin.setEncoding("utf-8");

  rl.on("line", async (line) => {
    sigint = false;

    tmp += line;

    if (line.length === 0) {
      rl.prompt();
      return;
    }

    if (tmp.startsWith(".")) {
      const cmd = tmp.trim() as Command;
      tmp = "";

      switch (cmd) {
        case ".help":
          console.log(
            "Commands:\n" +
              commands.map((c) => `  ${c}`).join("\n") +
              "\n\nType .quit to exit."
          );
          rl.setPrompt(">>> ");
          rl.prompt();
          return;
        case ".quit":
          rl.close();
          return;
        default:
          console.error(`Unknown command: ${cmd}`);
          rl.setPrompt(">>> ");
          rl.prompt();
          return;
      }
    }

    const result = await repl.feed(tmp);

    if (result) {
      tmp = "";
      rl.setPrompt(">>> ");
      rl.prompt();
      return;
    }

    rl.setPrompt("... ");
    rl.prompt();
  })
    .on("SIGINT", () => {
      if (sigint) {
        rl.close();
      }

      if (tmp.length > 0) {
        tmp = "";
        rl.setPrompt(">>> ");
        rl.prompt();
        return;
      }

      sigint = true;
      tmp = "";
      process.stderr.write("\npress ctrl+C again to exit\n");
      rl.setPrompt(">>> ");
      rl.prompt();
    })
    .on("close", () => {
      process.stderr.write("\nbye.\n");
      process.exit(0);
    });

  rl.prompt();
}

main();
