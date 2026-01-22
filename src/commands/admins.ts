import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface AdminGetOptions extends GlobalOptions {
  id: string;
}

export async function cmdAdminList(options: GlobalOptions): Promise<void> {
  const token = await getTokenAsync();
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }

  const spinner = ora("Fetching admins...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.admins.list();

    spinner.stop();

    output(
      {
        admins:
          result.admins?.map((admin) => ({
            id: admin?.id,
            name: admin?.name,
            email: admin?.email,
            type: admin?.type,
            away_mode_enabled: admin?.away_mode_enabled,
          })) ?? [],
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch admins");
    handleIntercomError(error);
  }
}

export async function cmdAdminGet(options: AdminGetOptions): Promise<void> {
  const token = await getTokenAsync();
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }

  const spinner = ora("Fetching admin...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const admin = await client.admins.find({ admin_id: Number(options.id) });

    spinner.stop();

    if (!admin) {
      throw new CLIError("Admin not found", 404);
    }

    output(
      {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        type: admin.type,
        away_mode_enabled: admin.away_mode_enabled,
        away_mode_reassign: admin.away_mode_reassign,
        has_inbox_seat: admin.has_inbox_seat,
        team_ids: admin.team_ids,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch admin");
    handleIntercomError(error);
  }
}
