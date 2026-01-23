import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(tmpdir(), "intercom-cli-test");

const originalEnv = { ...process.env };

describe("Config", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INTERCOM_ACCESS_TOKEN;

    if (existsSync(CONFIG_DIR)) {
      rmSync(CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    process.env = originalEnv;

    if (existsSync(CONFIG_DIR)) {
      rmSync(CONFIG_DIR, { recursive: true });
    }
  });

  describe("getToken", () => {
    test("returns null when no config and no env", async () => {
      const { getTokenAsync } = await import("../src/utils/config.ts");
      const token = await getTokenAsync(CONFIG_DIR);
      expect(token).toBeNull();
    });

    test("returns token from env if set", async () => {
      process.env.INTERCOM_ACCESS_TOKEN = "test-token-from-env";
      const { getTokenAsync } = await import("../src/utils/config.ts");
      const token = await getTokenAsync(CONFIG_DIR);
      expect(token).toBe("test-token-from-env");
    });

    test("returns null for empty env token", async () => {
      process.env.INTERCOM_ACCESS_TOKEN = "   ";
      const { getTokenAsync } = await import("../src/utils/config.ts");
      const token = await getTokenAsync(CONFIG_DIR);
      expect(token).toBeNull();
    });
  });

  describe("loadConfig", () => {
    test("returns null when config file does not exist", async () => {
      const { loadConfig } = await import("../src/utils/config.ts");
      const config = await loadConfig(CONFIG_DIR);
      expect(config).toBeNull();
    });
  });

  describe("saveConfig and loadConfig", () => {
    test("saves and loads config correctly", async () => {
      const { loadConfig, saveConfig } = await import("../src/utils/config.ts");
      await saveConfig(CONFIG_DIR, { token: "saved-token" });
      const config = await loadConfig(CONFIG_DIR);
      expect(config).toEqual({ token: "saved-token" });
    });
  });

  describe("ConfigError", () => {
    test("creates error with message", async () => {
      const { ConfigError } = await import("../src/utils/config.ts");
      const error = new ConfigError("Test error message");

      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("ConfigError");
      expect(error instanceof Error).toBe(true);
    });
  });
});
