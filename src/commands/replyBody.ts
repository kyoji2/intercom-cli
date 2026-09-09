import { readFile } from "node:fs/promises";
import { CLIError } from "../utils/index.ts";

export type ReplyBodyInput = {
  body?: string;
  bodyFile?: string;
};

export async function resolveReplyBody(input: ReplyBodyInput): Promise<string> {
  const hasBody = input.body !== undefined;
  const hasBodyFile = input.bodyFile !== undefined;

  if (hasBody === hasBodyFile) {
    throw new CLIError("Provide exactly one of --body or --body-file.", 400);
  }

  if (hasBody) {
    return input.body as string;
  }

  try {
    const body = await readFile(input.bodyFile as string, "utf8");
    if (body.length === 0) {
      throw new CLIError(`Body file is empty: ${input.bodyFile}`, 400);
    }
    return body;
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Unable to read body file: ${input.bodyFile}`, 400);
  }
}
