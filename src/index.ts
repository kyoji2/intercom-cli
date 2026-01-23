#!/usr/bin/env bun

import { Command } from "commander";
import { registerCommands } from "./cli/registry.ts";
import { handleIntercomError } from "./client.ts";
import { CLIError, DEFAULT_CONFIG_DIR, type GlobalOptions, type OutputFormat } from "./utils/index.ts";

const VERSION = "0.1.1";

function getGlobalOptions(cmd: Command): GlobalOptions {
  const opts = cmd.optsWithGlobals();
  return {
    dryRun: opts.dryRun ?? false,
    format: (opts.format as OutputFormat) ?? "toon",
    configDir: (opts.configDir as string) ?? DEFAULT_CONFIG_DIR,
  };
}

function formatAndExit(error: string, statusCode: number, hint?: string, format: OutputFormat = "toon"): never {
  const errorData = { error, status: statusCode, hint };

  if (format === "toon") {
    console.error(`error: ${error}`);
    console.error(`status: ${statusCode}`);
    if (hint) console.error(`hint: ${hint}`);
  } else {
    console.error(JSON.stringify(errorData, null, 2));
  }

  process.exit(1);
}

function withErrorHandler<T extends unknown[]>(fn: (...args: T) => Promise<void>): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      handleError(error);
    }
  };
}

function handleError(error: unknown): never {
  if (error instanceof CLIError) {
    formatAndExit(error.message, error.statusCode, error.hint);
  } else if (error instanceof SyntaxError) {
    formatAndExit(
      "Invalid JSON input provided to command.",
      400,
      "Ensure your JSON data is valid and properly escaped for the shell.",
    );
  } else {
    try {
      handleIntercomError(error);
    } catch (e) {
      if (e instanceof CLIError) {
        formatAndExit(e.message, e.statusCode, e.hint);
      }
      formatAndExit(`Unexpected error: ${error}`, 500, "Check the CLI logs or report this issue.");
    }
  }
}

const program = new Command();

program
  .name("intercom")
  .description("AI-native CLI for Intercom - manage customer conversations, contacts, messages, and support")
  .version(VERSION, "-v, --version")
  .option("--dry-run", "Log actions instead of making real API requests", false)
  .option("-f, --format <format>", "Output format: toon (default) or json", "toon")
  .option("--config-dir <path>", "Config directory", DEFAULT_CONFIG_DIR);
registerCommands(program, { getGlobalOptions, withErrorHandler });

program.parse();
