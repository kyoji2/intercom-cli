import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface TicketTypeListOptions extends GlobalOptions {}

export interface TicketTypeGetOptions extends GlobalOptions {
  id: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdTicketTypeList(options: TicketTypeListOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Listing ticket types...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.ticketTypes.list();

    spinner.stop();

    const ticketTypes = (result.data ?? [])
      .filter((tt): tt is NonNullable<typeof tt> => tt !== undefined)
      .map((tt) => ({
        id: tt.id,
        name: tt.name,
        description: tt.description,
        category: tt.category,
        icon: tt.icon,
        archived: tt.archived,
        created_at: tt.created_at,
        updated_at: tt.updated_at,
      }));

    output({ total: ticketTypes.length, ticket_types: ticketTypes }, options.format);
  } catch (error) {
    spinner.fail("Failed to list ticket types");
    handleIntercomError(error);
  }
}

export async function cmdTicketTypeGet(options: TicketTypeGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching ticket type...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const ticketType = await client.ticketTypes.get({ ticket_type_id: options.id });

    spinner.stop();

    output(
      {
        id: ticketType?.id,
        name: ticketType?.name,
        description: ticketType?.description,
        category: ticketType?.category,
        icon: ticketType?.icon,
        archived: ticketType?.archived,
        created_at: ticketType?.created_at,
        updated_at: ticketType?.updated_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch ticket type");
    handleIntercomError(error);
  }
}
