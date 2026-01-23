import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, deleteConfig, type GlobalOptions, getTokenAsync, output, saveConfig } from "../utils/index.ts";

export interface LoginOptions extends GlobalOptions {
  token?: string;
}

export async function cmdLogin(options: LoginOptions): Promise<void> {
  let token = options.token;

  if (!token) {
    const spinner = ora("Waiting for token input...").start();
    spinner.stop();

    process.stdout.write("Enter your Intercom Access Token: ");
    const input = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        data += chunk;
        if (data.includes("\n")) {
          process.stdin.pause();
          resolve(data.trim());
        }
      });
      process.stdin.resume();
    });
    token = input;
  }

  if (!token || token.trim().length === 0) {
    throw new CLIError("No token provided", 400, "Provide a token as argument or via prompt.");
  }

  const spinner = ora("Verifying token...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const admin = await client.admins.identify();

    if (!admin) {
      throw new CLIError("Could not verify token", 401, "The token may be invalid or expired.");
    }

    await saveConfig(options.configDir, { token });
    spinner.succeed("Logged in successfully");

    output(
      {
        status: "success",
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
        workspace: admin.app ? { id: admin.app.id_code, name: admin.app.name } : undefined,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Login failed");
    handleIntercomError(error);
  }
}

export async function cmdLogout(options: GlobalOptions): Promise<void> {
  await deleteConfig(options.configDir);
  output({ status: "success", message: "Logged out successfully" }, options.format);
}

export async function cmdWhoami(options: GlobalOptions): Promise<void> {
  const token = await getTokenAsync(options.configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }

  const spinner = ora("Fetching account info...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const admin = await client.admins.identify();

    if (!admin) {
      throw new CLIError("Could not identify admin", 401, "The token may be invalid or expired.");
    }

    spinner.stop();

    output(
      {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          type: admin.type,
          away_mode_enabled: admin.away_mode_enabled,
          away_mode_reassign: admin.away_mode_reassign,
        },
        workspace: admin.app
          ? {
              id: admin.app.id_code,
              name: admin.app.name,
              region: admin.app.region,
              timezone: admin.app.timezone,
            }
          : undefined,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch account info");
    handleIntercomError(error);
  }
}
