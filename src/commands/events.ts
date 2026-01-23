import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface EventTrackOptions extends GlobalOptions {
  name: string;
  userId?: string;
  email?: string;
  metadata?: string;
}

export interface EventListOptions extends GlobalOptions {
  userId: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdEventTrack(options: EventTrackOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Tracking event...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    if (!options.userId && !options.email) {
      throw new CLIError("Event requires --user-id or --email", 400);
    }

    const payload: Record<string, unknown> = {
      event_name: options.name,
      created_at: Math.floor(Date.now() / 1000),
    };

    if (options.userId) payload.user_id = options.userId;
    if (options.email) payload.email = options.email;
    if (options.metadata) payload.metadata = JSON.parse(options.metadata);

    await client.events.create(payload as Parameters<typeof client.events.create>[0]);

    spinner.succeed("Event tracked");

    output(
      {
        status: "success",
        event_name: options.name,
        user_id: options.userId,
        email: options.email,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to track event");
    handleIntercomError(error);
  }
}

export async function cmdEventList(options: EventListOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching events...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.events.list({
      type: "user",
      user_id: options.userId,
    });

    spinner.stop();

    const events =
      result.events
        ?.filter((event): event is NonNullable<typeof event> => event != null)
        .map((event) => ({
          name: event.name,
          first: event.first,
          last: event.last,
          count: event.count,
        })) ?? [];

    output({ total: events.length, events }, options.format);
  } catch (error) {
    spinner.fail("Failed to fetch events");
    handleIntercomError(error);
  }
}
