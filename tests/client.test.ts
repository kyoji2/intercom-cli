import { describe, expect, mock, test } from "bun:test";
import { createClient, handleIntercomError } from "../src/client.ts";
import { CLIError } from "../src/utils/output.ts";

const mockLogger = {
  log: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
};

describe("createClient", () => {
  test("creates client with token", () => {
    const client = createClient({ token: "test-token" });
    expect(client).toBeDefined();
    expect(client.admins).toBeDefined();
    expect(client.contacts).toBeDefined();
    expect(client.conversations).toBeDefined();
  });

  test("creates client with dryRun mode", () => {
    const client = createClient({ token: "test-token", dryRun: true }, mockLogger);
    expect(client).toBeDefined();
  });

  describe("dry run mode", () => {
    test("logs and returns mock for create operations", async () => {
      const client = createClient({ token: "test-token", dryRun: true }, mockLogger);

      const result = await client.contacts.create({ email: "test@example.com" });

      expect(result).toBeDefined();
      expect(mockLogger.log).toHaveBeenCalled();
    });

    test("logs and returns mock for delete operations", async () => {
      const client = createClient({ token: "test-token", dryRun: true }, mockLogger);

      const result = await client.contacts.delete({ contact_id: "123" });

      expect(result).toBeDefined();
    });

    test("logs and returns mock for update operations", async () => {
      const client = createClient({ token: "test-token", dryRun: true }, mockLogger);

      const result = await client.contacts.update({ contact_id: "123", name: "New Name" });

      expect(result).toBeDefined();
    });
  });
});

describe("handleIntercomError", () => {
  test("converts IntercomError to CLIError", () => {
    const error = new Error("Test error");

    expect(() => handleIntercomError(error)).toThrow(CLIError);
  });

  test("re-throws CLIError as-is", () => {
    const cliError = new CLIError("CLI Error", 400, "Test hint");

    expect(() => handleIntercomError(cliError)).toThrow(CLIError);

    try {
      handleIntercomError(cliError);
    } catch (e) {
      expect(e).toBeInstanceOf(CLIError);
      expect((e as CLIError).message).toBe("CLI Error");
      expect((e as CLIError).statusCode).toBe(400);
      expect((e as CLIError).hint).toBe("Test hint");
    }
  });

  test("converts unknown error to CLIError with 500 status", () => {
    const error = "string error";

    expect(() => handleIntercomError(error)).toThrow(CLIError);

    try {
      handleIntercomError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(CLIError);
      expect((e as CLIError).statusCode).toBe(500);
    }
  });

  test("converts SyntaxError to CLIError with 400 status", () => {
    const error = new SyntaxError("Unexpected end of JSON input");

    expect(() => handleIntercomError(error)).toThrow(CLIError);

    try {
      handleIntercomError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(CLIError);
      expect((e as CLIError).statusCode).toBe(400);
      expect((e as CLIError).message).toBe("Invalid JSON input provided to command.");
    }
  });
});

describe("CLIError", () => {
  test("creates error with message and status", () => {
    const error = new CLIError("Test error", 404);

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("CLIError");
  });

  test("creates error with hint", () => {
    const error = new CLIError("Test error", 400, "Try again");

    expect(error.hint).toBe("Try again");
  });

  test("is instanceof Error", () => {
    const error = new CLIError("Test error", 500);

    expect(error instanceof Error).toBe(true);
    expect(error instanceof CLIError).toBe(true);
  });
});
