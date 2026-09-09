import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveReplyBody } from "../src/commands/replyBody.ts";
import { CLIError } from "../src/utils/output.ts";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "intercom-cli-reply-body-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("resolveReplyBody", () => {
  test("returns --body unchanged", async () => {
    await expect(resolveReplyBody({ body: "inline reply" })).resolves.toBe("inline reply");
  });

  test("reads an exact Unicode multiline body from --body-file", async () => {
    const directory = await createTemporaryDirectory();
    const path = join(directory, "reply.txt");
    const contents = "Hello, 世界!\n\nSecond line with emoji 🎉";
    await writeFile(path, contents, "utf8");

    await expect(resolveReplyBody({ bodyFile: path })).resolves.toBe(contents);
  });

  test("rejects both --body and --body-file", async () => {
    await expect(resolveReplyBody({ body: "inline", bodyFile: "reply.txt" })).rejects.toThrow(CLIError);
  });

  test("rejects when neither --body nor --body-file is supplied", async () => {
    await expect(resolveReplyBody({})).rejects.toThrow(CLIError);
  });

  test("rejects a missing body file", async () => {
    await expect(resolveReplyBody({ bodyFile: "/missing/reply.txt" })).rejects.toThrow(CLIError);
  });

  test("rejects an unreadable body file", async () => {
    const directory = await createTemporaryDirectory();

    await expect(resolveReplyBody({ bodyFile: directory })).rejects.toThrow(CLIError);
  });

  test("rejects an empty body file", async () => {
    const directory = await createTemporaryDirectory();
    const path = join(directory, "empty.txt");
    await writeFile(path, "", "utf8");

    await expect(resolveReplyBody({ bodyFile: path })).rejects.toThrow(CLIError);
  });
});
