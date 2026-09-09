import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "bun";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as {
  version?: string;
};
const expectedVersion = packageJson.version ?? "";

describe("CLI Integration", () => {
  const cli = async (args: string) => {
    const proc = spawn({
      cmd: ["bun", "run", "src/index.ts", ...args.split(" ")],
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    return { stdout, stderr, exitCode };
  };

  describe("help and version", () => {
    test("--help shows usage", async () => {
      const { stdout } = await cli("--help");

      expect(stdout).toContain("Usage:");
      expect(stdout).toContain("intercom");
      expect(stdout).toContain("Commands:");
    });

    test("--version shows version", async () => {
      const { stdout } = await cli("--version");

      expect(stdout).toContain(expectedVersion);
    });

    test("-h shows help", async () => {
      const { stdout } = await cli("-h");

      expect(stdout).toContain("Usage:");
    });

    test("-v shows version", async () => {
      const { stdout } = await cli("-v");

      expect(stdout).toContain(expectedVersion);
    });
  });

  describe("subcommand help", () => {
    test("contact --help shows subcommands", async () => {
      const { stdout } = await cli("contact --help");

      expect(stdout).toContain("create");
      expect(stdout).toContain("get");
      expect(stdout).toContain("update");
      expect(stdout).toContain("delete");
      expect(stdout).toContain("search");
      expect(stdout).toContain("list");
    });

    test("conversation --help shows subcommands", async () => {
      const { stdout } = await cli("conversation --help");

      expect(stdout).toContain("list");
      expect(stdout).toContain("get");
      expect(stdout).toContain("search");
      expect(stdout).toContain("reply");
      expect(stdout).toContain("assign");
      expect(stdout).toContain("close");
    });

    test("conversation reply --help shows body input, --type, and --json options", async () => {
      const { stdout } = await cli("conversation reply --help");

      expect(stdout).toContain("--body");
      expect(stdout).toContain("--body-file");
      expect(stdout).toContain("--type");
      expect(stdout).toContain("--json");
    });

    test("company --help shows subcommands", async () => {
      const { stdout } = await cli("company --help");

      expect(stdout).toContain("create");
      expect(stdout).toContain("get");
      expect(stdout).toContain("list");
      expect(stdout).toContain("update");
    });

    test("tag --help shows subcommands", async () => {
      const { stdout } = await cli("tag --help");

      expect(stdout).toContain("list");
      expect(stdout).toContain("create");
      expect(stdout).toContain("delete");
    });

    test("article --help shows subcommands", async () => {
      const { stdout } = await cli("article --help");

      expect(stdout).toContain("list");
      expect(stdout).toContain("get");
      expect(stdout).toContain("search");
      expect(stdout).toContain("create");
      expect(stdout).toContain("update");
      expect(stdout).toContain("delete");
    });

    test("event --help shows subcommands", async () => {
      const { stdout } = await cli("event --help");

      expect(stdout).toContain("track");
      expect(stdout).toContain("list");
    });

    test("admin --help shows subcommands", async () => {
      const { stdout } = await cli("admin --help");

      expect(stdout).toContain("list");
      expect(stdout).toContain("get");
    });

    test("ticket reply --help shows body input, --type, and --json options", async () => {
      const { stdout } = await cli("ticket reply --help");

      expect(stdout).toContain("--body");
      expect(stdout).toContain("--body-file");
      expect(stdout).toContain("--type");
      expect(stdout).toContain("--json");
    });
  });

  describe("schema command", () => {
    test("schema outputs JSON", async () => {
      const { stdout } = await cli("schema");

      const parsed = JSON.parse(stdout);
      expect(parsed.api_version).toBeDefined();
      expect(parsed.resources).toBeDefined();
      expect(parsed.resources.contacts).toBeDefined();
      expect(parsed.resources.conversations).toBeDefined();
      expect(parsed.usage_examples).toBeDefined();
    });
  });

  describe("error handling", () => {
    test("unknown command shows error", async () => {
      const { exitCode } = await cli("unknown-command");

      expect(exitCode).not.toBe(0);
    });

    test("missing required argument shows error", async () => {
      const { exitCode } = await cli("contact get");

      expect(exitCode).not.toBe(0);
    });
  });

  describe("dry-run mode", () => {
    test("--dry-run is accepted", async () => {
      const { exitCode } = await cli("--dry-run schema");

      expect(exitCode).toBe(0);
    });

    test("conversation reply reads a body file and displays its final payload", async () => {
      const directory = await mkdtemp(join(tmpdir(), "intercom-cli-dry-run-"));
      const bodyFile = join(directory, "reply.txt");
      const body = "Hello, 世界!\n\nSecond line 🎉";
      await writeFile(bodyFile, body, "utf8");

      try {
        const proc = spawn({
          cmd: [
            "bun",
            "run",
            "src/index.ts",
            "--dry-run",
            "conversation",
            "reply",
            "conversation-id",
            "--admin",
            "admin-id",
            "--body-file",
            bodyFile,
          ],
          env: { ...process.env, INTERCOM_ACCESS_TOKEN: "test-token" },
          stdout: "pipe",
          stderr: "pipe",
        });
        const stdout = await new Response(proc.stdout).text();
        const exitCode = await proc.exited;

        expect(exitCode).toBe(0);
        expect(stdout).toContain("[DRY RUN] client.conversations.reply");
        expect(stdout).toContain(JSON.stringify(body));
        expect(stdout).toContain('"message_type": "comment"');
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });

    test("ticket reply reads a body file and displays its final payload", async () => {
      const directory = await mkdtemp(join(tmpdir(), "intercom-cli-dry-run-"));
      const bodyFile = join(directory, "reply.txt");
      const body = "Ticket reply\nwith multiple lines";
      await writeFile(bodyFile, body, "utf8");

      try {
        const proc = spawn({
          cmd: [
            "bun",
            "run",
            "src/index.ts",
            "--dry-run",
            "ticket",
            "reply",
            "ticket-id",
            "--admin",
            "admin-id",
            "--body-file",
            bodyFile,
            "--type",
            "note",
          ],
          env: { ...process.env, INTERCOM_ACCESS_TOKEN: "test-token" },
          stdout: "pipe",
          stderr: "pipe",
        });
        const stdout = await new Response(proc.stdout).text();
        const exitCode = await proc.exited;

        expect(exitCode).toBe(0);
        expect(stdout).toContain("[DRY RUN] client.tickets.reply");
        expect(stdout).toContain(JSON.stringify(body));
        expect(stdout).toContain('"message_type": "note"');
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  });

  describe("format option", () => {
    test("--format json is accepted", async () => {
      const { exitCode } = await cli("--format json schema");

      expect(exitCode).toBe(0);
    });

    test("-f toon is accepted", async () => {
      const { exitCode } = await cli("-f toon schema");

      expect(exitCode).toBe(0);
    });
  });
});
