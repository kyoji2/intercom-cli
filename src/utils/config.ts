import { existsSync, readFileSync } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Config {
  token: string;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export const DEFAULT_CONFIG_DIR = join(homedir(), ".config", "intercom-cli");

function getConfigFile(configDir: string): string {
  return join(configDir, "config.json");
}

function isValidConfig(data: unknown): data is Config {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.token === "string" && obj.token.length > 0;
}

export async function loadConfig(configDir: string): Promise<Config | null> {
  try {
    const configFile = getConfigFile(configDir);
    try {
      await access(configFile);
    } catch {
      return null;
    }

    const text = await readFile(configFile, "utf-8");
    if (!text.trim()) return null;

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ConfigError(
        `Invalid JSON in config file: ${configFile}. Delete the file and run 'intercom login' again.`,
      );
    }

    if (!isValidConfig(data)) {
      throw new ConfigError(
        `Invalid config format in ${configFile}. Expected { "token": "..." }. Delete the file and run 'intercom login' again.`,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    return null;
  }
}

export function loadConfigSync(configDir: string): Config | null {
  try {
    const configFile = getConfigFile(configDir);
    if (!existsSync(configFile)) return null;

    const text = readFileSync(configFile, "utf-8");
    if (!text.trim()) return null;

    const data = JSON.parse(text);
    if (!isValidConfig(data)) return null;

    return data;
  } catch {
    return null;
  }
}

export async function saveConfig(configDir: string, config: Config): Promise<void> {
  if (!config.token || typeof config.token !== "string") {
    throw new ConfigError("Invalid token: token must be a non-empty string");
  }

  const configFile = getConfigFile(configDir);
  await mkdir(configDir, { recursive: true });
  await writeFile(configFile, JSON.stringify(config, null, 2), "utf-8");
}

export async function deleteConfig(configDir: string): Promise<void> {
  try {
    const configFile = getConfigFile(configDir);
    await rm(configFile, { force: true });
  } catch {}
}

export function getToken(configDir: string): string | null {
  const envToken = process.env.INTERCOM_ACCESS_TOKEN;
  if (envToken) {
    if (envToken.trim().length === 0) {
      return null;
    }
    return envToken.trim();
  }

  const config = loadConfigSync(configDir);
  return config?.token || null;
}

export async function getTokenAsync(configDir: string): Promise<string | null> {
  const envToken = process.env.INTERCOM_ACCESS_TOKEN;
  if (envToken) {
    if (envToken.trim().length === 0) {
      return null;
    }
    return envToken.trim();
  }

  const config = await loadConfig(configDir);
  return config?.token || null;
}
