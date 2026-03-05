import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";
import { buildAdminReplyPayload } from "./replyPayload.ts";

export interface ConversationListOptions extends GlobalOptions {
  limit?: string;
}

export interface ConversationGetOptions extends GlobalOptions {
  id: string;
}

export interface ConversationSearchOptions extends GlobalOptions {
  json?: string;
  state?: string;
  assignee?: string;
  limit?: string;
}

export interface ConversationReplyOptions extends GlobalOptions {
  id: string;
  adminId: string;
  body: string;
  messageType?: string;
  json?: string;
}

export interface ConversationAssignOptions extends GlobalOptions {
  id: string;
  adminId: string;
  assigneeId: string;
}

export interface ConversationCloseOptions extends GlobalOptions {
  id: string;
  adminId: string;
}

export interface ConversationOpenOptions extends GlobalOptions {
  id: string;
  adminId: string;
}

export interface ConversationSnoozeOptions extends GlobalOptions {
  id: string;
  adminId: string;
  until: string;
}

export interface ConversationConvertOptions extends GlobalOptions {
  id: string;
  ticketTypeId: string;
  title?: string;
  description?: string;
  json?: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdConversationList(options: ConversationListOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Listing conversations...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const limit = options.limit ? Number.parseInt(options.limit, 10) : 25;

    const result = await client.conversations.list({ per_page: Math.min(limit, 50) });

    spinner.stop();

    const conversations: unknown[] = [];
    for await (const conv of result) {
      conversations.push({
        id: conv.id,
        state: conv.state,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        waiting_since: conv.waiting_since,
        snoozed_until: conv.snoozed_until,
        open: conv.open,
        read: conv.read,
        priority: conv.priority,
      });
      if (conversations.length >= limit) break;
    }

    output({ total: conversations.length, conversations }, options.format);
  } catch (error) {
    spinner.fail("Failed to list conversations");
    handleIntercomError(error);
  }
}

export async function cmdConversationGet(options: ConversationGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching conversation...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const conv = await client.conversations.find({ conversation_id: options.id });

    spinner.stop();

    output(
      {
        id: conv.id,
        state: conv.state,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        waiting_since: conv.waiting_since,
        snoozed_until: conv.snoozed_until,
        open: conv.open,
        read: conv.read,
        priority: conv.priority,
        source: conv.source,
        contacts: conv.contacts,
        teammates: conv.teammates,
        admin_assignee_id: conv.admin_assignee_id,
        team_assignee_id: conv.team_assignee_id,
        tags: conv.tags,
        first_contact_reply: conv.first_contact_reply,
        sla_applied: conv.sla_applied,
        statistics: conv.statistics,
        conversation_parts: conv.conversation_parts,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch conversation");
    handleIntercomError(error);
  }
}

export async function cmdConversationSearch(options: ConversationSearchOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Searching conversations...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let query: Record<string, unknown>;
    if (options.json) {
      query = JSON.parse(options.json);
    } else if (options.state) {
      query = {
        query: {
          field: "state",
          operator: "=",
          value: options.state,
        },
      };
    } else if (options.assignee) {
      query = {
        query: {
          field: "admin_assignee_id",
          operator: "=",
          value: Number.parseInt(options.assignee, 10),
        },
      };
    } else {
      throw new CLIError("Search requires --json, --state, or --assignee", 400);
    }

    if (options.limit) {
      query.pagination = { per_page: Number.parseInt(options.limit, 10) };
    }

    const searchPayload = { query: query.query, pagination: query.pagination };
    const result = await client.conversations.search(
      searchPayload as Parameters<typeof client.conversations.search>[0],
    );

    spinner.stop();

    const conversations: unknown[] = [];
    for await (const conv of result) {
      conversations.push({
        id: conv.id,
        state: conv.state,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      });
      if (options.limit && conversations.length >= Number.parseInt(options.limit, 10)) break;
    }

    output({ total: conversations.length, conversations }, options.format);
  } catch (error) {
    spinner.fail("Failed to search conversations");
    handleIntercomError(error);
  }
}

export async function cmdConversationReply(options: ConversationReplyOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Sending reply...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.conversations.reply({
      conversation_id: options.id,
      body: buildAdminReplyPayload({
        adminId: options.adminId,
        body: options.body,
        messageType: options.messageType,
        json: options.json,
      }),
    });

    spinner.succeed("Reply sent");

    output(
      {
        id: result.id,
        state: result.state,
        conversation_parts: result.conversation_parts,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to send reply");
    handleIntercomError(error);
  }
}

export async function cmdConversationAssign(options: ConversationAssignOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Assigning conversation...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.conversations.manage({
      conversation_id: options.id,
      body: {
        message_type: "assignment",
        type: "admin",
        admin_id: options.adminId,
        assignee_id: options.assigneeId,
      },
    });

    spinner.succeed("Conversation assigned");

    output(
      {
        id: result.id,
        admin_assignee_id: result.admin_assignee_id,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to assign conversation");
    handleIntercomError(error);
  }
}

export async function cmdConversationClose(options: ConversationCloseOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Closing conversation...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.conversations.manage({
      conversation_id: options.id,
      body: {
        message_type: "close",
        type: "admin",
        admin_id: options.adminId,
      },
    });

    spinner.succeed("Conversation closed");

    output(
      {
        id: result.id,
        state: result.state,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to close conversation");
    handleIntercomError(error);
  }
}

export async function cmdConversationOpen(options: ConversationOpenOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Opening conversation...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.conversations.manage({
      conversation_id: options.id,
      body: {
        message_type: "open",
        admin_id: options.adminId,
      },
    });

    spinner.succeed("Conversation opened");

    output(
      {
        id: result.id,
        state: result.state,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to open conversation");
    handleIntercomError(error);
  }
}

export async function cmdConversationSnooze(options: ConversationSnoozeOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Snoozing conversation...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.conversations.manage({
      conversation_id: options.id,
      body: {
        message_type: "snoozed",
        admin_id: options.adminId,
        snoozed_until: Number.parseInt(options.until, 10),
      },
    });

    spinner.succeed("Conversation snoozed");

    output(
      {
        id: result.id,
        state: result.state,
        snoozed_until: result.snoozed_until,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to snooze conversation");
    handleIntercomError(error);
  }
}

export async function cmdConversationConvert(options: ConversationConvertOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Converting conversation to ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let attributes: Record<string, unknown> | undefined;
    if (options.json) {
      attributes = JSON.parse(options.json);
    } else if (options.title || options.description) {
      attributes = {};
      if (options.title) {
        attributes._default_title_ = options.title;
      }
      if (options.description) {
        attributes._default_description_ = options.description;
      }
    }

    const ticket = await client.conversations.convertToTicket({
      conversation_id: Number.parseInt(options.id, 10),
      ticket_type_id: options.ticketTypeId,
      attributes,
    });

    spinner.succeed("Conversation converted to ticket");

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        category: ticket?.category,
        ticket_type: ticket?.ticket_type,
        ticket_state: ticket?.ticket_state,
        ticket_attributes: ticket?.ticket_attributes,
        open: ticket?.open,
        created_at: ticket?.created_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to convert conversation to ticket");
    handleIntercomError(error);
  }
}
