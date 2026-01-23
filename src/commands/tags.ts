import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface TagCreateOptions extends GlobalOptions {
  name: string;
}

export interface TagGetOptions extends GlobalOptions {
  id: string;
}

export interface TagDeleteOptions extends GlobalOptions {
  id: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdTagList(options: GlobalOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching tags...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.tags.list();

    spinner.stop();

    output(
      {
        tags:
          result.data?.map((tag) => ({
            id: tag.id,
            name: tag.name,
          })) ?? [],
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch tags");
    handleIntercomError(error);
  }
}

export async function cmdTagCreate(options: TagCreateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Creating tag...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const tag = await client.tags.create({ name: options.name });

    spinner.succeed("Tag created");

    output(
      {
        id: tag.id,
        name: tag.name,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to create tag");
    handleIntercomError(error);
  }
}

export async function cmdTagGet(options: TagGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching tag...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const tag = await client.tags.find({ tag_id: options.id });

    spinner.stop();

    output(
      {
        id: tag.id,
        name: tag.name,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch tag");
    handleIntercomError(error);
  }
}

export async function cmdTagDelete(options: TagDeleteOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Deleting tag...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    await client.tags.delete({ tag_id: options.id });

    spinner.succeed("Tag deleted");

    output({ deleted: true, id: options.id }, options.format);
  } catch (error) {
    spinner.fail("Failed to delete tag");
    handleIntercomError(error);
  }
}
