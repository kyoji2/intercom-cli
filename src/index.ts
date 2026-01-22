#!/usr/bin/env bun

import { Command } from "commander";
import { handleIntercomError } from "./client.ts";
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
} from "./commands/index.ts";
import { CLIError, type GlobalOptions, type OutputFormat } from "./utils/index.ts";

const VERSION = "0.1.0";

function getGlobalOptions(cmd: Command): GlobalOptions {
  const opts = cmd.optsWithGlobals();
  return {
    dryRun: opts.dryRun ?? false,
    format: (opts.format as OutputFormat) ?? "toon",
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
  .option("-f, --format <format>", "Output format: toon (default) or json", "toon");

program
  .command("login")
  .description("Login with your Intercom Access Token")
  .argument("[token]", "Access token (will prompt if not provided)")
  .action(
    withErrorHandler(async (token: string | undefined, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdLogin({ ...globalOpts, token });
    }),
  );

program
  .command("logout")
  .description("Remove stored credentials")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdLogout(globalOpts);
    }),
  );

program
  .command("whoami")
  .description("Show current admin and workspace info")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdWhoami(globalOpts);
    }),
  );

program
  .command("context")
  .description("Show account context (admins, workspace)")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContext(globalOpts);
    }),
  );

program
  .command("schema")
  .description("Dump API schemas and usage examples (for AI context)")
  .action(() => {
    cmdSchema();
  });

const adminCmd = program.command("admin").description("Manage admins");

adminCmd
  .command("list")
  .description("List all admins in workspace")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdAdminList(globalOpts);
    }),
  );

adminCmd
  .command("get")
  .description("Get admin details")
  .argument("<id>", "Admin ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdAdminGet({ ...globalOpts, id });
    }),
  );

const contactCmd = program.command("contact").description("Manage contacts");

contactCmd
  .command("create")
  .description("Create a new contact")
  .option("--email <email>", "Contact email")
  .option("--name <name>", "Contact name")
  .option("--phone <phone>", "Contact phone")
  .option("--user-id <id>", "External user ID")
  .option("--json <json>", "Full contact data as JSON")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactCreate({
        ...globalOpts,
        email: options.email,
        name: options.name,
        phone: options.phone,
        userId: options.userId,
        json: options.json,
      });
    }),
  );

contactCmd
  .command("get")
  .description("Get contact details")
  .argument("<id>", "Contact ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactGet({ ...globalOpts, id });
    }),
  );

contactCmd
  .command("update")
  .description("Update a contact")
  .argument("<id>", "Contact ID")
  .option("--name <name>", "New name")
  .option("--email <email>", "New email")
  .option("--phone <phone>", "New phone")
  .option("--json <json>", "Update data as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactUpdate({
        ...globalOpts,
        id,
        name: options.name,
        email: options.email,
        phone: options.phone,
        json: options.json,
      });
    }),
  );

contactCmd
  .command("delete")
  .description("Delete a contact")
  .argument("<id>", "Contact ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactDelete({ ...globalOpts, id });
    }),
  );

contactCmd
  .command("search")
  .description("Search contacts")
  .option("--email <email>", "Search by email")
  .option("--json <json>", "Search query as JSON")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactSearch({
        ...globalOpts,
        email: options.email,
        json: options.json,
        limit: options.limit,
      });
    }),
  );

contactCmd
  .command("list")
  .description("List contacts")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactList({ ...globalOpts, limit: options.limit });
    }),
  );

contactCmd
  .command("note")
  .description("Add a note to contact")
  .argument("<id>", "Contact ID")
  .argument("<body>", "Note body")
  .action(
    withErrorHandler(async (id: string, body: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactNote({ ...globalOpts, id, body });
    }),
  );

contactCmd
  .command("notes")
  .description("List contact notes")
  .argument("<id>", "Contact ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactNotes({ ...globalOpts, id });
    }),
  );

contactCmd
  .command("tag")
  .description("Add tag to contact")
  .argument("<contact-id>", "Contact ID")
  .argument("<tag-id>", "Tag ID")
  .action(
    withErrorHandler(async (contactId: string, tagId: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactTag({ ...globalOpts, contactId, tagId });
    }),
  );

contactCmd
  .command("untag")
  .description("Remove tag from contact")
  .argument("<contact-id>", "Contact ID")
  .argument("<tag-id>", "Tag ID")
  .action(
    withErrorHandler(async (contactId: string, tagId: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactUntag({ ...globalOpts, contactId, tagId });
    }),
  );

contactCmd
  .command("attach-company")
  .description("Attach contact to company")
  .argument("<contact-id>", "Contact ID")
  .argument("<company-id>", "Company ID")
  .action(
    withErrorHandler(async (contactId: string, companyId: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdContactAttachCompany({ ...globalOpts, contactId, companyId });
    }),
  );

const conversationCmd = program.command("conversation").description("Manage conversations");

conversationCmd
  .command("list")
  .description("List conversations")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationList({ ...globalOpts, limit: options.limit });
    }),
  );

conversationCmd
  .command("get")
  .description("Get conversation details")
  .argument("<id>", "Conversation ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationGet({ ...globalOpts, id });
    }),
  );

conversationCmd
  .command("search")
  .description("Search conversations")
  .option("--state <state>", "Filter by state (open, closed, snoozed)")
  .option("--assignee <id>", "Filter by assignee admin ID")
  .option("--json <json>", "Search query as JSON")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationSearch({
        ...globalOpts,
        state: options.state,
        assignee: options.assignee,
        json: options.json,
        limit: options.limit,
      });
    }),
  );

conversationCmd
  .command("reply")
  .description("Reply to a conversation")
  .argument("<id>", "Conversation ID")
  .requiredOption("--admin <id>", "Admin ID sending the reply")
  .requiredOption("--body <body>", "Reply message body")
  .option("--json <json>", "Additional reply data as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationReply({
        ...globalOpts,
        id,
        adminId: options.admin,
        body: options.body,
        json: options.json,
      });
    }),
  );

conversationCmd
  .command("assign")
  .description("Assign conversation to admin/team")
  .argument("<id>", "Conversation ID")
  .requiredOption("--admin <id>", "Admin ID performing assignment")
  .requiredOption("--assignee <id>", "Assignee ID (admin or team)")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationAssign({
        ...globalOpts,
        id,
        adminId: options.admin,
        assigneeId: options.assignee,
      });
    }),
  );

conversationCmd
  .command("close")
  .description("Close a conversation")
  .argument("<id>", "Conversation ID")
  .requiredOption("--admin <id>", "Admin ID closing the conversation")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationClose({ ...globalOpts, id, adminId: options.admin });
    }),
  );

conversationCmd
  .command("open")
  .description("Reopen a conversation")
  .argument("<id>", "Conversation ID")
  .requiredOption("--admin <id>", "Admin ID opening the conversation")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationOpen({ ...globalOpts, id, adminId: options.admin });
    }),
  );

conversationCmd
  .command("snooze")
  .description("Snooze a conversation")
  .argument("<id>", "Conversation ID")
  .requiredOption("--admin <id>", "Admin ID snoozing the conversation")
  .requiredOption("--until <timestamp>", "Unix timestamp to snooze until")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationSnooze({
        ...globalOpts,
        id,
        adminId: options.admin,
        until: options.until,
      });
    }),
  );

conversationCmd
  .command("convert")
  .description("Convert conversation to a ticket")
  .argument("<id>", "Conversation ID")
  .requiredOption("--type-id <id>", "Ticket type ID")
  .option("--title <title>", "Ticket title")
  .option("--description <desc>", "Ticket description")
  .option("--json <json>", "Ticket attributes as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdConversationConvert({
        ...globalOpts,
        id,
        ticketTypeId: options.typeId,
        title: options.title,
        description: options.description,
        json: options.json,
      });
    }),
  );

const companyCmd = program.command("company").description("Manage companies");

companyCmd
  .command("create")
  .description("Create a company")
  .requiredOption("--company-id <id>", "Unique company identifier")
  .requiredOption("--name <name>", "Company name")
  .option("--plan <plan>", "Company plan")
  .option("--size <size>", "Company size")
  .option("--website <url>", "Company website")
  .option("--json <json>", "Additional company data as JSON")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdCompanyCreate({
        ...globalOpts,
        companyId: options.companyId,
        name: options.name,
        plan: options.plan,
        size: options.size,
        website: options.website,
        json: options.json,
      });
    }),
  );

companyCmd
  .command("get")
  .description("Get company details")
  .argument("<id>", "Company ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdCompanyGet({ ...globalOpts, id });
    }),
  );

companyCmd
  .command("list")
  .description("List companies")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdCompanyList({ ...globalOpts, limit: options.limit });
    }),
  );

companyCmd
  .command("update")
  .description("Update a company")
  .argument("<id>", "Company ID")
  .requiredOption("--json <json>", "Update data as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdCompanyUpdate({ ...globalOpts, id, json: options.json });
    }),
  );

const tagCmd = program.command("tag").description("Manage tags");

tagCmd
  .command("list")
  .description("List all tags")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTagList(globalOpts);
    }),
  );

tagCmd
  .command("create")
  .description("Create a tag")
  .argument("<name>", "Tag name")
  .action(
    withErrorHandler(async (name: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTagCreate({ ...globalOpts, name });
    }),
  );

tagCmd
  .command("get")
  .description("Get tag details")
  .argument("<id>", "Tag ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTagGet({ ...globalOpts, id });
    }),
  );

tagCmd
  .command("delete")
  .description("Delete a tag")
  .argument("<id>", "Tag ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTagDelete({ ...globalOpts, id });
    }),
  );

const articleCmd = program.command("article").description("Manage help center articles");

articleCmd
  .command("list")
  .description("List articles")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleList({ ...globalOpts, limit: options.limit });
    }),
  );

articleCmd
  .command("get")
  .description("Get article details")
  .argument("<id>", "Article ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleGet({ ...globalOpts, id });
    }),
  );

articleCmd
  .command("search")
  .description("Search articles")
  .argument("<query>", "Search query")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (query: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleSearch({ ...globalOpts, query, limit: options.limit });
    }),
  );

articleCmd
  .command("create")
  .description("Create an article")
  .requiredOption("--title <title>", "Article title")
  .requiredOption("--author-id <id>", "Author admin ID")
  .option("--body <body>", "Article body (HTML)")
  .option("--description <desc>", "Article description")
  .option("--state <state>", "Article state (draft, published)")
  .option("--parent-id <id>", "Parent collection/section ID")
  .option("--parent-type <type>", "Parent type (collection, section)")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleCreate({
        ...globalOpts,
        title: options.title,
        authorId: options.authorId,
        body: options.body,
        description: options.description,
        state: options.state,
        parentId: options.parentId,
        parentType: options.parentType,
      });
    }),
  );

articleCmd
  .command("update")
  .description("Update an article")
  .argument("<id>", "Article ID")
  .requiredOption("--json <json>", "Update data as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleUpdate({ ...globalOpts, id, json: options.json });
    }),
  );

articleCmd
  .command("delete")
  .description("Delete an article")
  .argument("<id>", "Article ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdArticleDelete({ ...globalOpts, id });
    }),
  );

const eventCmd = program.command("event").description("Track and list events");

eventCmd
  .command("track")
  .description("Track a custom event")
  .requiredOption("--name <name>", "Event name")
  .option("--user-id <id>", "User ID")
  .option("--email <email>", "User email")
  .option("--metadata <json>", "Event metadata as JSON")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdEventTrack({
        ...globalOpts,
        name: options.name,
        userId: options.userId,
        email: options.email,
        metadata: options.metadata,
      });
    }),
  );

eventCmd
  .command("list")
  .description("List events for a user")
  .requiredOption("--user-id <id>", "User ID")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdEventList({ ...globalOpts, userId: options.userId });
    }),
  );

const ticketCmd = program.command("ticket").description("Manage tickets");

ticketCmd
  .command("create")
  .description("Create a new ticket")
  .option("--type-id <id>", "Ticket type ID")
  .option("--contact-id <id>", "Contact ID")
  .option("--title <title>", "Ticket title")
  .option("--description <desc>", "Ticket description")
  .option("--company-id <id>", "Company ID")
  .option("--assignee-id <id>", "Assignee admin ID")
  .option("--json <json>", "Full ticket data as JSON")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketCreate({
        ...globalOpts,
        ticketTypeId: options.typeId,
        contactId: options.contactId,
        title: options.title,
        description: options.description,
        companyId: options.companyId,
        assigneeId: options.assigneeId,
        json: options.json,
      });
    }),
  );

ticketCmd
  .command("get")
  .description("Get ticket details")
  .argument("<id>", "Ticket ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketGet({ ...globalOpts, id });
    }),
  );

ticketCmd
  .command("update")
  .description("Update a ticket")
  .argument("<id>", "Ticket ID")
  .option("--state-id <id>", "Ticket state ID")
  .option("--assignee-id <id>", "Assignee ID (admin or team)")
  .option("--admin-id <id>", "Admin ID performing the update")
  .option("--open", "Set ticket as open")
  .option("--closed", "Set ticket as closed")
  .option("--snoozed-until <timestamp>", "Unix timestamp to snooze until")
  .option("--json <json>", "Update data as JSON")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      let open: boolean | undefined;
      if (options.open) open = true;
      if (options.closed) open = false;
      await cmdTicketUpdate({
        ...globalOpts,
        id,
        stateId: options.stateId,
        assigneeId: options.assigneeId,
        adminId: options.adminId,
        open,
        snoozedUntil: options.snoozedUntil,
        json: options.json,
      });
    }),
  );

ticketCmd
  .command("delete")
  .description("Delete a ticket")
  .argument("<id>", "Ticket ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketDelete({ ...globalOpts, id });
    }),
  );

ticketCmd
  .command("search")
  .description("Search tickets")
  .option("--state <state>", "Filter by state (open, closed)")
  .option("--assignee <id>", "Filter by assignee admin ID")
  .option("--json <json>", "Search query as JSON")
  .option("-l, --limit <limit>", "Maximum results", "25")
  .action(
    withErrorHandler(async (options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketSearch({
        ...globalOpts,
        state: options.state,
        assignee: options.assignee,
        json: options.json,
        limit: options.limit,
      });
    }),
  );

ticketCmd
  .command("reply")
  .description("Reply to a ticket")
  .argument("<id>", "Ticket ID")
  .requiredOption("--admin <id>", "Admin ID sending the reply")
  .requiredOption("--body <body>", "Reply message body")
  .option("--type <type>", "Message type (comment, note)", "comment")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketReply({
        ...globalOpts,
        id,
        adminId: options.admin,
        body: options.body,
        messageType: options.type,
      });
    }),
  );

ticketCmd
  .command("close")
  .description("Close a ticket")
  .argument("<id>", "Ticket ID")
  .requiredOption("--admin <id>", "Admin ID closing the ticket")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketClose({ ...globalOpts, id, adminId: options.admin });
    }),
  );

ticketCmd
  .command("assign")
  .description("Assign ticket to admin/team")
  .argument("<id>", "Ticket ID")
  .requiredOption("--admin <id>", "Admin ID performing assignment")
  .requiredOption("--assignee <id>", "Assignee ID (admin or team)")
  .action(
    withErrorHandler(async (id: string, options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketAssign({
        ...globalOpts,
        id,
        adminId: options.admin,
        assigneeId: options.assignee,
      });
    }),
  );

const ticketTypeCmd = program.command("ticket-type").description("Manage ticket types");

ticketTypeCmd
  .command("list")
  .description("List all ticket types")
  .action(
    withErrorHandler(async (_options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketTypeList(globalOpts);
    }),
  );

ticketTypeCmd
  .command("get")
  .description("Get ticket type details")
  .argument("<id>", "Ticket type ID")
  .action(
    withErrorHandler(async (id: string, _options, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      await cmdTicketTypeGet({ ...globalOpts, id });
    }),
  );

program.parse();
