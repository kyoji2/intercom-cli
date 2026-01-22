import type { Intercom } from "intercom-client";
import { IntercomClient, IntercomError } from "intercom-client";
import { CLIError } from "./utils/output.ts";

export interface ClientOptions {
  token: string;
  dryRun?: boolean;
}

export interface Logger {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const defaultLogger: Logger = {
  log: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

export function createClient(options: ClientOptions, logger: Logger = defaultLogger): IntercomClient {
  const client = new IntercomClient({ token: options.token });

  if (options.dryRun) {
    return createDryRunProxy(client, logger);
  }

  return client;
}

function createDryRunProxy(client: IntercomClient, logger: Logger): IntercomClient {
  const writeMethodPatterns = [
    "create",
    "update",
    "delete",
    "add",
    "remove",
    "attach",
    "detach",
    "assign",
    "close",
    "open",
    "snooze",
    "redact",
    "convert",
    "away",
    "tag",
    "untag",
  ];

  const createNestedProxy = <T extends object>(target: T, path: string[]): T => {
    return new Proxy(target, {
      get(obj, prop: string) {
        const value = (obj as Record<string, unknown>)[prop];
        const currentPath = [...path, prop];

        if (typeof value === "function") {
          const isWriteMethod = writeMethodPatterns.some((pattern) =>
            prop.toLowerCase().includes(pattern.toLowerCase()),
          );

          if (isWriteMethod) {
            return (...args: unknown[]) => {
              logger.log(`[DRY RUN] ${currentPath.join(".")}`);
              if (args.length > 0 && typeof args[0] === "object") {
                const filtered = Object.fromEntries(
                  Object.entries(args[0] as Record<string, unknown>).filter(
                    ([k]) => !k.toLowerCase().includes("token"),
                  ),
                );
                logger.log(`Payload: ${JSON.stringify(filtered, null, 2)}`);
              }
              return Promise.resolve(getDryRunResponse(prop));
            };
          }

          return value.bind(obj);
        }

        if (value && typeof value === "object") {
          return createNestedProxy(value, currentPath);
        }

        return value;
      },
    });
  };

  return createNestedProxy(client, ["client"]);
}

function getDryRunResponse(method: string): unknown {
  if (method.includes("delete") || method.includes("remove")) {
    return { deleted: true, id: "dry-run-id" };
  }

  if (method.includes("list")) {
    return { data: [], pages: { next: null } };
  }

  return {
    id: "dry-run-id",
    type: "dry-run",
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function handleIntercomError(error: unknown): never {
  if (error instanceof IntercomError) {
    let hint: string | undefined;
    if (error.statusCode === 401) {
      hint = "Authentication failed. Try running 'intercom login' again.";
    } else if (error.statusCode === 404) {
      hint = "The requested resource was not found. Verify the ID is correct.";
    } else if (error.statusCode === 400) {
      hint = "Invalid request. Check your input parameters.";
    } else if (error.statusCode === 429) {
      hint = "Rate limit exceeded. Wait a few minutes before trying again.";
    }
    throw new CLIError(error.message, error.statusCode ?? 500, hint);
  }

  if (error instanceof CLIError) {
    throw error;
  }

  throw new CLIError(`Unexpected error: ${error}`, 500, "Check the CLI logs or report this issue.");
}

export { IntercomClient, IntercomError };
export type { Intercom };
