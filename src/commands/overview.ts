import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export async function cmdContext(options: GlobalOptions): Promise<void> {
  const token = await getTokenAsync(options.configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }

  const spinner = ora("Fetching account context...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const [admin, admins] = await Promise.all([client.admins.identify(), client.admins.list()]);

    if (!admin) {
      throw new CLIError("Could not identify admin", 401, "The token may be invalid or expired.");
    }

    spinner.stop();

    output(
      {
        current_admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
        workspace: admin.app
          ? {
              id: admin.app.id_code,
              name: admin.app.name,
              region: admin.app.region,
              timezone: admin.app.timezone,
            }
          : undefined,
        team: {
          total_admins: admins.admins?.length ?? 0,
          admins: admins.admins?.map((a) => ({
            id: a?.id,
            name: a?.name,
            email: a?.email,
          })),
        },
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch context");
    handleIntercomError(error);
  }
}

export function cmdSchema(): void {
  const schema = {
    api_version: "2.11",
    sdk: "intercom-client@7.0.1",
    resources: {
      admins: {
        methods: ["identify", "list", "find", "away", "listAllActivityLogs"],
        description: "Manage workspace admins and their away status",
      },
      contacts: {
        methods: ["create", "find", "update", "delete", "search", "list"],
        subresources: {
          notes: ["create", "list"],
          tags: ["create", "list", "delete"],
          companies: ["create", "list", "delete"],
        },
        description: "Manage customer contacts (users and leads)",
      },
      conversations: {
        methods: ["create", "find", "update", "list", "search", "redact", "convert"],
        subresources: {
          parts: ["create"],
        },
        description: "Manage customer conversations and replies",
      },
      companies: {
        methods: ["create", "update", "find", "list", "delete", "scroll"],
        subresources: {
          contacts: ["list"],
        },
        description: "Manage companies and their contacts",
      },
      tags: {
        methods: ["list", "create", "find", "delete"],
        description: "Manage tags for contacts and conversations",
      },
      articles: {
        methods: ["list", "create", "find", "update", "delete", "search"],
        description: "Manage help center articles",
      },
      events: {
        methods: ["create", "list"],
        description: "Track and list custom user events",
      },
      helpCenters: {
        methods: ["find", "list"],
        description: "Manage help centers",
      },
      collections: {
        methods: ["create", "find", "update", "delete", "list"],
        description: "Manage article collections",
      },
      teams: {
        methods: ["list", "find"],
        description: "Manage teams",
      },
      segments: {
        methods: ["list", "find"],
        description: "Manage user segments",
      },
    },
    usage_examples: {
      create_contact: 'intercom contact create --email "user@example.com" --name "John Doe"',
      search_contacts: 'intercom contact search --email "user@example.com"',
      list_conversations: "intercom conversation list --limit 10",
      reply_conversation: 'intercom conversation reply <id> --admin <admin-id> --body "Thank you!"',
      create_tag: 'intercom tag create "VIP Customer"',
      search_articles: 'intercom article search "getting started"',
    },
  };

  console.log(JSON.stringify(schema, null, 2));
}
