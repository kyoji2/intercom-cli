import { readFile } from "node:fs/promises";
import MarkdownIt from "markdown-it";
import { CLIError } from "../utils/index.ts";

export type ReplyBodyInput = {
  body?: string;
  bodyFile?: string;
  bodyFormat?: string;
};

const markdown = new MarkdownIt({
  html: false,
  breaks: false,
});

function renderReplyBody(body: string, bodyFormat?: string): string {
  if (bodyFormat === undefined) {
    return body;
  }

  if (bodyFormat !== "markdown") {
    throw new CLIError(`Unsupported --body-format value: ${bodyFormat}`, 400, "Use markdown.");
  }

  return markdown.render(body);
}

export async function resolveReplyBody(input: ReplyBodyInput): Promise<string> {
  const hasBody = input.body !== undefined;
  const hasBodyFile = input.bodyFile !== undefined;

  if (hasBody === hasBodyFile) {
    throw new CLIError("Provide exactly one of --body or --body-file.", 400);
  }

  if (hasBody) {
    return renderReplyBody(input.body as string, input.bodyFormat);
  }

  try {
    const body = await readFile(input.bodyFile as string, "utf8");
    if (body.length === 0) {
      throw new CLIError(`Body file is empty: ${input.bodyFile}`, 400);
    }
    return renderReplyBody(body, input.bodyFormat);
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Unable to read body file: ${input.bodyFile}`, 400);
  }
}
