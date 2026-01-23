import type { Command } from "commander";
import {
  cmdAdminGet,
  cmdAdminList,
  cmdArticleCreate,
  cmdArticleDelete,
  cmdArticleGet,
  cmdArticleList,
  cmdArticleSearch,
  cmdArticleUpdate,
  cmdCompanyCreate,
  cmdCompanyGet,
  cmdCompanyList,
  cmdCompanyUpdate,
  cmdContactAttachCompany,
  cmdContactCreate,
  cmdContactDelete,
  cmdContactGet,
  cmdContactList,
  cmdContactNote,
  cmdContactNotes,
  cmdContactSearch,
  cmdContactTag,
  cmdContactUntag,
  cmdContactUpdate,
  cmdContext,
  cmdConversationAssign,
  cmdConversationClose,
  cmdConversationConvert,
  cmdConversationGet,
  cmdConversationList,
  cmdConversationOpen,
  cmdConversationReply,
  cmdConversationSearch,
  cmdConversationSnooze,
  cmdEventList,
  cmdEventTrack,
  cmdLogin,
  cmdLogout,
  cmdSchema,
  cmdTagCreate,
  cmdTagDelete,
  cmdTagGet,
  cmdTagList,
  cmdTicketAssign,
  cmdTicketClose,
  cmdTicketCreate,
  cmdTicketDelete,
  cmdTicketGet,
  cmdTicketReply,
  cmdTicketSearch,
  cmdTicketTypeGet,
  cmdTicketTypeList,
  cmdTicketUpdate,
  cmdWhoami,
} from "../commands/index.ts";
import type { GlobalOptions } from "../utils/index.ts";

type ActionArgs = {
  globals: GlobalOptions;
  args: unknown[];
  options: Record<string, unknown>;
};

type CommandAction = (params: ActionArgs) => Promise<void>;

type OptionSpec = {
  flags: string;
  description: string;
  defaultValue?: string;
};

type ArgSpec = {
  name: string;
  description: string;
};

type CommandSpec = {
  name: string;
  description: string;
  args?: ArgSpec[];
  options?: OptionSpec[];
  requiredOptions?: OptionSpec[];
  action: CommandAction;
};

type RegisterContext = {
  getGlobalOptions: (cmd: Command) => GlobalOptions;
  withErrorHandler: <T extends unknown[]>(fn: (...args: T) => Promise<void>) => (...args: T) => Promise<void>;
};

function applyOption(command: Command, option: OptionSpec, required: boolean): void {
  if (required) {
    if (option.defaultValue !== undefined) {
      command.requiredOption(option.flags, option.description, option.defaultValue);
    } else {
      command.requiredOption(option.flags, option.description);
    }
    return;
  }

  if (option.defaultValue !== undefined) {
    command.option(option.flags, option.description, option.defaultValue);
  } else {
    command.option(option.flags, option.description);
  }
}

function registerCommand(parent: Command, spec: CommandSpec, ctx: RegisterContext): void {
  const command = parent.command(spec.name).description(spec.description);

  spec.args?.forEach((arg) => {
    command.argument(arg.name, arg.description);
  });

  spec.options?.forEach((option) => {
    applyOption(command, option, false);
  });
  spec.requiredOptions?.forEach((option) => {
    applyOption(command, option, true);
  });

  command.action(
    ctx.withErrorHandler(async (...actionArgs: unknown[]) => {
      const cmd = actionArgs.length > 0 ? (actionArgs[actionArgs.length - 1] as Command) : undefined;
      const options = actionArgs.length > 1 ? (actionArgs[actionArgs.length - 2] as Record<string, unknown>) : {};
      const args = actionArgs.length > 2 ? actionArgs.slice(0, -2) : [];
      const globals = ctx.getGlobalOptions(cmd ?? command);
      await spec.action({ globals, args, options });
    }),
  );
}

function registerGroup(
  program: Command,
  name: string,
  description: string,
  specs: CommandSpec[],
  ctx: RegisterContext,
) {
  const group = program.command(name).description(description);
  specs.forEach((spec) => {
    registerCommand(group, spec, ctx);
  });
}

export function registerCommands(program: Command, ctx: RegisterContext): void {
  registerCommand(
    program,
    {
      name: "login",
      description: "Login with your Intercom Access Token",
      args: [{ name: "[token]", description: "Access token (will prompt if not provided)" }],
      action: async ({ globals, args }) => {
        const token = args[0] as string | undefined;
        await cmdLogin({ ...globals, token });
      },
    },
    ctx,
  );

  registerCommand(
    program,
    {
      name: "logout",
      description: "Remove stored credentials",
      action: async ({ globals }) => {
        await cmdLogout(globals);
      },
    },
    ctx,
  );

  registerCommand(
    program,
    {
      name: "whoami",
      description: "Show current admin and workspace info",
      action: async ({ globals }) => {
        await cmdWhoami(globals);
      },
    },
    ctx,
  );

  registerCommand(
    program,
    {
      name: "context",
      description: "Show account context (admins, workspace)",
      action: async ({ globals }) => {
        await cmdContext(globals);
      },
    },
    ctx,
  );

  registerCommand(
    program,
    {
      name: "schema",
      description: "Dump API schemas and usage examples (for AI context)",
      action: async () => {
        cmdSchema();
      },
    },
    ctx,
  );

  registerGroup(
    program,
    "admin",
    "Manage admins",
    [
      {
        name: "list",
        description: "List all admins in workspace",
        action: async ({ globals }) => {
          await cmdAdminList(globals);
        },
      },
      {
        name: "get",
        description: "Get admin details",
        args: [{ name: "<id>", description: "Admin ID" }],
        action: async ({ globals, args }) => {
          await cmdAdminGet({ ...globals, id: String(args[0]) });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "contact",
    "Manage contacts",
    [
      {
        name: "create",
        description: "Create a new contact",
        options: [
          { flags: "--email <email>", description: "Contact email" },
          { flags: "--name <name>", description: "Contact name" },
          { flags: "--phone <phone>", description: "Contact phone" },
          { flags: "--user-id <id>", description: "External user ID" },
          { flags: "--json <json>", description: "Full contact data as JSON" },
        ],
        action: async ({ globals, options }) => {
          await cmdContactCreate({
            ...globals,
            email: options.email as string | undefined,
            name: options.name as string | undefined,
            phone: options.phone as string | undefined,
            userId: options.userId as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "get",
        description: "Get contact details",
        args: [{ name: "<id>", description: "Contact ID" }],
        action: async ({ globals, args }) => {
          await cmdContactGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "update",
        description: "Update a contact",
        args: [{ name: "<id>", description: "Contact ID" }],
        options: [
          { flags: "--name <name>", description: "New name" },
          { flags: "--email <email>", description: "New email" },
          { flags: "--phone <phone>", description: "New phone" },
          { flags: "--json <json>", description: "Update data as JSON" },
        ],
        action: async ({ globals, args, options }) => {
          await cmdContactUpdate({
            ...globals,
            id: String(args[0]),
            name: options.name as string | undefined,
            email: options.email as string | undefined,
            phone: options.phone as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "delete",
        description: "Delete a contact",
        args: [{ name: "<id>", description: "Contact ID" }],
        action: async ({ globals, args }) => {
          await cmdContactDelete({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "search",
        description: "Search contacts",
        options: [
          { flags: "--email <email>", description: "Search by email" },
          { flags: "--json <json>", description: "Search query as JSON" },
          { flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" },
        ],
        action: async ({ globals, options }) => {
          await cmdContactSearch({
            ...globals,
            email: options.email as string | undefined,
            json: options.json as string | undefined,
            limit: options.limit as string | undefined,
          });
        },
      },
      {
        name: "list",
        description: "List contacts",
        options: [{ flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" }],
        action: async ({ globals, options }) => {
          await cmdContactList({
            ...globals,
            limit: options.limit as string | undefined,
          });
        },
      },
      {
        name: "note",
        description: "Add a note to contact",
        args: [
          { name: "<id>", description: "Contact ID" },
          { name: "<body>", description: "Note body" },
        ],
        action: async ({ globals, args }) => {
          await cmdContactNote({ ...globals, id: String(args[0]), body: String(args[1]) });
        },
      },
      {
        name: "notes",
        description: "List contact notes",
        args: [{ name: "<id>", description: "Contact ID" }],
        action: async ({ globals, args }) => {
          await cmdContactNotes({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "tag",
        description: "Add tag to contact",
        args: [
          { name: "<contact-id>", description: "Contact ID" },
          { name: "<tag-id>", description: "Tag ID" },
        ],
        action: async ({ globals, args }) => {
          await cmdContactTag({ ...globals, contactId: String(args[0]), tagId: String(args[1]) });
        },
      },
      {
        name: "untag",
        description: "Remove tag from contact",
        args: [
          { name: "<contact-id>", description: "Contact ID" },
          { name: "<tag-id>", description: "Tag ID" },
        ],
        action: async ({ globals, args }) => {
          await cmdContactUntag({ ...globals, contactId: String(args[0]), tagId: String(args[1]) });
        },
      },
      {
        name: "attach-company",
        description: "Attach contact to company",
        args: [
          { name: "<contact-id>", description: "Contact ID" },
          { name: "<company-id>", description: "Company ID" },
        ],
        action: async ({ globals, args }) => {
          await cmdContactAttachCompany({
            ...globals,
            contactId: String(args[0]),
            companyId: String(args[1]),
          });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "conversation",
    "Manage conversations",
    [
      {
        name: "list",
        description: "List conversations",
        options: [{ flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" }],
        action: async ({ globals, options }) => {
          await cmdConversationList({ ...globals, limit: options.limit as string | undefined });
        },
      },
      {
        name: "get",
        description: "Get conversation details",
        args: [{ name: "<id>", description: "Conversation ID" }],
        action: async ({ globals, args }) => {
          await cmdConversationGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "search",
        description: "Search conversations",
        options: [
          { flags: "--state <state>", description: "Filter by state (open, closed, snoozed)" },
          { flags: "--assignee <id>", description: "Filter by assignee admin ID" },
          { flags: "--json <json>", description: "Search query as JSON" },
          { flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" },
        ],
        action: async ({ globals, options }) => {
          await cmdConversationSearch({
            ...globals,
            state: options.state as string | undefined,
            assignee: options.assignee as string | undefined,
            json: options.json as string | undefined,
            limit: options.limit as string | undefined,
          });
        },
      },
      {
        name: "reply",
        description: "Reply to a conversation",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [
          { flags: "--admin <id>", description: "Admin ID sending the reply" },
          { flags: "--body <body>", description: "Reply message body" },
        ],
        options: [{ flags: "--json <json>", description: "Additional reply data as JSON" }],
        action: async ({ globals, args, options }) => {
          await cmdConversationReply({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
            body: options.body as string,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "assign",
        description: "Assign conversation to admin/team",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [
          { flags: "--admin <id>", description: "Admin ID performing assignment" },
          { flags: "--assignee <id>", description: "Assignee ID (admin or team)" },
        ],
        action: async ({ globals, args, options }) => {
          await cmdConversationAssign({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
            assigneeId: options.assignee as string,
          });
        },
      },
      {
        name: "close",
        description: "Close a conversation",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [{ flags: "--admin <id>", description: "Admin ID closing the conversation" }],
        action: async ({ globals, args, options }) => {
          await cmdConversationClose({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
          });
        },
      },
      {
        name: "open",
        description: "Reopen a conversation",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [{ flags: "--admin <id>", description: "Admin ID opening the conversation" }],
        action: async ({ globals, args, options }) => {
          await cmdConversationOpen({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
          });
        },
      },
      {
        name: "snooze",
        description: "Snooze a conversation",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [
          { flags: "--admin <id>", description: "Admin ID snoozing the conversation" },
          { flags: "--until <timestamp>", description: "Unix timestamp to snooze until" },
        ],
        action: async ({ globals, args, options }) => {
          await cmdConversationSnooze({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
            until: options.until as string,
          });
        },
      },
      {
        name: "convert",
        description: "Convert conversation to a ticket",
        args: [{ name: "<id>", description: "Conversation ID" }],
        requiredOptions: [{ flags: "--type-id <id>", description: "Ticket type ID" }],
        options: [
          { flags: "--title <title>", description: "Ticket title" },
          { flags: "--description <desc>", description: "Ticket description" },
          { flags: "--json <json>", description: "Ticket attributes as JSON" },
        ],
        action: async ({ globals, args, options }) => {
          await cmdConversationConvert({
            ...globals,
            id: String(args[0]),
            ticketTypeId: options.typeId as string,
            title: options.title as string | undefined,
            description: options.description as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "company",
    "Manage companies",
    [
      {
        name: "create",
        description: "Create a company",
        requiredOptions: [
          { flags: "--company-id <id>", description: "Unique company identifier" },
          { flags: "--name <name>", description: "Company name" },
        ],
        options: [
          { flags: "--plan <plan>", description: "Company plan" },
          { flags: "--size <size>", description: "Company size" },
          { flags: "--website <url>", description: "Company website" },
          { flags: "--json <json>", description: "Additional company data as JSON" },
        ],
        action: async ({ globals, options }) => {
          await cmdCompanyCreate({
            ...globals,
            companyId: options.companyId as string,
            name: options.name as string,
            plan: options.plan as string | undefined,
            size: options.size as string | undefined,
            website: options.website as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "get",
        description: "Get company details",
        args: [{ name: "<id>", description: "Company ID" }],
        action: async ({ globals, args }) => {
          await cmdCompanyGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "list",
        description: "List companies",
        options: [{ flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" }],
        action: async ({ globals, options }) => {
          await cmdCompanyList({ ...globals, limit: options.limit as string | undefined });
        },
      },
      {
        name: "update",
        description: "Update a company",
        args: [{ name: "<id>", description: "Company ID" }],
        requiredOptions: [{ flags: "--json <json>", description: "Update data as JSON" }],
        action: async ({ globals, args, options }) => {
          await cmdCompanyUpdate({ ...globals, id: String(args[0]), json: options.json as string });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "tag",
    "Manage tags",
    [
      {
        name: "list",
        description: "List all tags",
        action: async ({ globals }) => {
          await cmdTagList(globals);
        },
      },
      {
        name: "create",
        description: "Create a tag",
        args: [{ name: "<name>", description: "Tag name" }],
        action: async ({ globals, args }) => {
          await cmdTagCreate({ ...globals, name: String(args[0]) });
        },
      },
      {
        name: "get",
        description: "Get tag details",
        args: [{ name: "<id>", description: "Tag ID" }],
        action: async ({ globals, args }) => {
          await cmdTagGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "delete",
        description: "Delete a tag",
        args: [{ name: "<id>", description: "Tag ID" }],
        action: async ({ globals, args }) => {
          await cmdTagDelete({ ...globals, id: String(args[0]) });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "article",
    "Manage help center articles",
    [
      {
        name: "list",
        description: "List articles",
        options: [{ flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" }],
        action: async ({ globals, options }) => {
          await cmdArticleList({ ...globals, limit: options.limit as string | undefined });
        },
      },
      {
        name: "get",
        description: "Get article details",
        args: [{ name: "<id>", description: "Article ID" }],
        action: async ({ globals, args }) => {
          await cmdArticleGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "search",
        description: "Search articles",
        args: [{ name: "<query>", description: "Search query" }],
        options: [{ flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" }],
        action: async ({ globals, args, options }) => {
          await cmdArticleSearch({
            ...globals,
            query: String(args[0]),
            limit: options.limit as string | undefined,
          });
        },
      },
      {
        name: "create",
        description: "Create an article",
        requiredOptions: [
          { flags: "--title <title>", description: "Article title" },
          { flags: "--author-id <id>", description: "Author admin ID" },
        ],
        options: [
          { flags: "--body <body>", description: "Article body (HTML)" },
          { flags: "--description <desc>", description: "Article description" },
          { flags: "--state <state>", description: "Article state (draft, published)" },
          { flags: "--parent-id <id>", description: "Parent collection/section ID" },
          { flags: "--parent-type <type>", description: "Parent type (collection, section)" },
        ],
        action: async ({ globals, options }) => {
          await cmdArticleCreate({
            ...globals,
            title: options.title as string,
            authorId: options.authorId as string,
            body: options.body as string | undefined,
            description: options.description as string | undefined,
            state: options.state as string | undefined,
            parentId: options.parentId as string | undefined,
            parentType: options.parentType as string | undefined,
          });
        },
      },
      {
        name: "update",
        description: "Update an article",
        args: [{ name: "<id>", description: "Article ID" }],
        requiredOptions: [{ flags: "--json <json>", description: "Update data as JSON" }],
        action: async ({ globals, args, options }) => {
          await cmdArticleUpdate({ ...globals, id: String(args[0]), json: options.json as string });
        },
      },
      {
        name: "delete",
        description: "Delete an article",
        args: [{ name: "<id>", description: "Article ID" }],
        action: async ({ globals, args }) => {
          await cmdArticleDelete({ ...globals, id: String(args[0]) });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "event",
    "Track and list events",
    [
      {
        name: "track",
        description: "Track a custom event",
        requiredOptions: [{ flags: "--name <name>", description: "Event name" }],
        options: [
          { flags: "--user-id <id>", description: "User ID" },
          { flags: "--email <email>", description: "User email" },
          { flags: "--metadata <json>", description: "Event metadata as JSON" },
        ],
        action: async ({ globals, options }) => {
          await cmdEventTrack({
            ...globals,
            name: options.name as string,
            userId: options.userId as string | undefined,
            email: options.email as string | undefined,
            metadata: options.metadata as string | undefined,
          });
        },
      },
      {
        name: "list",
        description: "List events for a user",
        requiredOptions: [{ flags: "--user-id <id>", description: "User ID" }],
        action: async ({ globals, options }) => {
          await cmdEventList({ ...globals, userId: options.userId as string });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "ticket",
    "Manage tickets",
    [
      {
        name: "create",
        description: "Create a new ticket",
        options: [
          { flags: "--type-id <id>", description: "Ticket type ID" },
          { flags: "--contact-id <id>", description: "Contact ID" },
          { flags: "--title <title>", description: "Ticket title" },
          { flags: "--description <desc>", description: "Ticket description" },
          { flags: "--company-id <id>", description: "Company ID" },
          { flags: "--assignee-id <id>", description: "Assignee admin ID" },
          { flags: "--json <json>", description: "Full ticket data as JSON" },
        ],
        action: async ({ globals, options }) => {
          await cmdTicketCreate({
            ...globals,
            ticketTypeId: options.typeId as string,
            contactId: options.contactId as string,
            title: options.title as string | undefined,
            description: options.description as string | undefined,
            companyId: options.companyId as string | undefined,
            assigneeId: options.assigneeId as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "get",
        description: "Get ticket details",
        args: [{ name: "<id>", description: "Ticket ID" }],
        action: async ({ globals, args }) => {
          await cmdTicketGet({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "update",
        description: "Update a ticket",
        args: [{ name: "<id>", description: "Ticket ID" }],
        options: [
          { flags: "--state-id <id>", description: "Ticket state ID" },
          { flags: "--assignee-id <id>", description: "Assignee ID (admin or team)" },
          { flags: "--admin-id <id>", description: "Admin ID performing the update" },
          { flags: "--open", description: "Set ticket as open" },
          { flags: "--closed", description: "Set ticket as closed" },
          { flags: "--snoozed-until <timestamp>", description: "Unix timestamp to snooze until" },
          { flags: "--json <json>", description: "Update data as JSON" },
        ],
        action: async ({ globals, args, options }) => {
          let open: boolean | undefined;
          if (options.open) open = true;
          if (options.closed) open = false;
          await cmdTicketUpdate({
            ...globals,
            id: String(args[0]),
            stateId: options.stateId as string | undefined,
            assigneeId: options.assigneeId as string | undefined,
            adminId: options.adminId as string | undefined,
            open,
            snoozedUntil: options.snoozedUntil as string | undefined,
            json: options.json as string | undefined,
          });
        },
      },
      {
        name: "delete",
        description: "Delete a ticket",
        args: [{ name: "<id>", description: "Ticket ID" }],
        action: async ({ globals, args }) => {
          await cmdTicketDelete({ ...globals, id: String(args[0]) });
        },
      },
      {
        name: "search",
        description: "Search tickets",
        options: [
          { flags: "--state <state>", description: "Filter by state (open, closed)" },
          { flags: "--assignee <id>", description: "Filter by assignee admin ID" },
          { flags: "--json <json>", description: "Search query as JSON" },
          { flags: "-l, --limit <limit>", description: "Maximum results", defaultValue: "25" },
        ],
        action: async ({ globals, options }) => {
          await cmdTicketSearch({
            ...globals,
            state: options.state as string | undefined,
            assignee: options.assignee as string | undefined,
            json: options.json as string | undefined,
            limit: options.limit as string | undefined,
          });
        },
      },
      {
        name: "reply",
        description: "Reply to a ticket",
        args: [{ name: "<id>", description: "Ticket ID" }],
        requiredOptions: [
          { flags: "--admin <id>", description: "Admin ID sending the reply" },
          { flags: "--body <body>", description: "Reply message body" },
        ],
        options: [{ flags: "--type <type>", description: "Message type (comment, note)", defaultValue: "comment" }],
        action: async ({ globals, args, options }) => {
          await cmdTicketReply({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
            body: options.body as string,
            messageType: options.type as string | undefined,
          });
        },
      },
      {
        name: "close",
        description: "Close a ticket",
        args: [{ name: "<id>", description: "Ticket ID" }],
        requiredOptions: [{ flags: "--admin <id>", description: "Admin ID closing the ticket" }],
        action: async ({ globals, args, options }) => {
          await cmdTicketClose({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
          });
        },
      },
      {
        name: "assign",
        description: "Assign ticket to admin/team",
        args: [{ name: "<id>", description: "Ticket ID" }],
        requiredOptions: [
          { flags: "--admin <id>", description: "Admin ID performing assignment" },
          { flags: "--assignee <id>", description: "Assignee ID (admin or team)" },
        ],
        action: async ({ globals, args, options }) => {
          await cmdTicketAssign({
            ...globals,
            id: String(args[0]),
            adminId: options.admin as string,
            assigneeId: options.assignee as string,
          });
        },
      },
    ],
    ctx,
  );

  registerGroup(
    program,
    "ticket-type",
    "Manage ticket types",
    [
      {
        name: "list",
        description: "List all ticket types",
        action: async ({ globals }) => {
          await cmdTicketTypeList(globals);
        },
      },
      {
        name: "get",
        description: "Get ticket type details",
        args: [{ name: "<id>", description: "Ticket type ID" }],
        action: async ({ globals, args }) => {
          await cmdTicketTypeGet({ ...globals, id: String(args[0]) });
        },
      },
    ],
    ctx,
  );
}
