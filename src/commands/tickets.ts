import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";
import { resolveReplyBody } from "./replyBody.ts";
import { buildAdminReplyPayload } from "./replyPayload.ts";

export interface TicketGetOptions extends GlobalOptions {
  id: string;
}

export interface TicketCreateOptions extends GlobalOptions {
  ticketTypeId: string;
  contactId: string;
  title?: string;
  description?: string;
  companyId?: string;
  assigneeId?: string;
  json?: string;
}

export interface TicketUpdateOptions extends GlobalOptions {
  id: string;
  stateId?: string;
  assigneeId?: string;
  open?: boolean;
  snoozedUntil?: string;
  adminId?: string;
  json?: string;
}

export interface TicketDeleteOptions extends GlobalOptions {
  id: string;
}

export interface TicketSearchOptions extends GlobalOptions {
  state?: string;
  assignee?: string;
  json?: string;
  limit?: string;
}

export interface TicketReplyOptions extends GlobalOptions {
  id: string;
  adminId: string;
  body?: string;
  bodyFile?: string;
  bodyFormat?: string;
  messageType?: string;
  json?: string;
}

export interface TicketCloseOptions extends GlobalOptions {
  id: string;
  adminId: string;
}

export interface TicketAssignOptions extends GlobalOptions {
  id: string;
  adminId: string;
  assigneeId: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdTicketGet(options: TicketGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const ticket = await client.tickets.get({ ticket_id: options.id });

    spinner.stop();

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        category: ticket?.category,
        ticket_type: ticket?.ticket_type,
        ticket_state: ticket?.ticket_state,
        ticket_attributes: ticket?.ticket_attributes,
        contacts: ticket?.contacts,
        admin_assignee_id: ticket?.admin_assignee_id,
        team_assignee_id: ticket?.team_assignee_id,
        created_at: ticket?.created_at,
        updated_at: ticket?.updated_at,
        open: ticket?.open,
        snoozed_until: ticket?.snoozed_until,
        is_shared: ticket?.is_shared,
        linked_objects: ticket?.linked_objects,
        ticket_parts: ticket?.ticket_parts,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch ticket");
    handleIntercomError(error);
  }
}

export async function cmdTicketCreate(options: TicketCreateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Creating ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let payload: Record<string, unknown>;
    if (options.json) {
      payload = JSON.parse(options.json);
    } else {
      if (!options.ticketTypeId || !options.contactId) {
        throw new CLIError(
          "Missing required options",
          400,
          "Provide --type-id and --contact-id, or use --json for full payload.",
        );
      }

      payload = {
        ticket_type_id: options.ticketTypeId,
        contacts: [{ id: options.contactId }],
      };

      const ticketAttributes: Record<string, string> = {};
      if (options.title) {
        ticketAttributes._default_title_ = options.title;
      }
      if (options.description) {
        ticketAttributes._default_description_ = options.description;
      }
      if (Object.keys(ticketAttributes).length > 0) {
        payload.ticket_attributes = ticketAttributes;
      }

      if (options.companyId) {
        payload.company_id = options.companyId;
      }
      if (options.assigneeId) {
        payload.assignment = { admin_assignee_id: options.assigneeId };
      }
    }

    const ticket = await client.tickets.create(payload as unknown as Parameters<typeof client.tickets.create>[0]);

    spinner.succeed("Ticket created");

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        category: ticket?.category,
        ticket_type: ticket?.ticket_type,
        ticket_state: ticket?.ticket_state,
        open: ticket?.open,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to create ticket");
    handleIntercomError(error);
  }
}

export async function cmdTicketUpdate(options: TicketUpdateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Updating ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let payload: Record<string, unknown> = { ticket_id: options.id };

    if (options.json) {
      const jsonData = JSON.parse(options.json);
      payload = { ...payload, ...jsonData };
    } else {
      if (options.stateId) {
        payload.ticket_state_id = options.stateId;
      }
      if (options.assigneeId) {
        payload.assignee_id = options.assigneeId;
      }
      if (options.open !== undefined) {
        payload.open = options.open;
      }
      if (options.snoozedUntil) {
        payload.snoozed_until = Number.parseInt(options.snoozedUntil, 10);
      }
      if (options.adminId) {
        payload.admin_id = Number.parseInt(options.adminId, 10);
      }
    }

    const ticket = await client.tickets.update(payload as unknown as Parameters<typeof client.tickets.update>[0]);

    spinner.succeed("Ticket updated");

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        ticket_state: ticket?.ticket_state,
        admin_assignee_id: ticket?.admin_assignee_id,
        team_assignee_id: ticket?.team_assignee_id,
        open: ticket?.open,
        snoozed_until: ticket?.snoozed_until,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to update ticket");
    handleIntercomError(error);
  }
}

export async function cmdTicketDelete(options: TicketDeleteOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Deleting ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    await client.tickets.deleteTicket({ ticket_id: options.id });

    spinner.succeed("Ticket deleted");

    output({ deleted: true, id: options.id }, options.format);
  } catch (error) {
    spinner.fail("Failed to delete ticket");
    handleIntercomError(error);
  }
}

export async function cmdTicketSearch(options: TicketSearchOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Searching tickets...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let query: Record<string, unknown>;
    if (options.json) {
      query = JSON.parse(options.json);
    } else if (options.state) {
      query = {
        query: {
          field: "open",
          operator: "=",
          value: options.state === "open",
        },
      };
    } else if (options.assignee) {
      query = {
        query: {
          field: "admin_assignee_id",
          operator: "=",
          value: options.assignee,
        },
      };
    } else {
      query = {
        query: {
          field: "open",
          operator: "=",
          value: true,
        },
      };
    }

    if (options.limit) {
      query.pagination = { per_page: Number.parseInt(options.limit, 10) };
    }

    const searchPayload = { query: query.query, pagination: query.pagination };
    const result = await client.tickets.search(searchPayload as Parameters<typeof client.tickets.search>[0]);

    spinner.stop();

    const tickets: unknown[] = [];
    for await (const ticket of result) {
      tickets.push({
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        category: ticket?.category,
        ticket_state: ticket?.ticket_state,
        open: ticket?.open,
        created_at: ticket?.created_at,
        updated_at: ticket?.updated_at,
      });
      if (options.limit && tickets.length >= Number.parseInt(options.limit, 10)) break;
    }

    output({ total: tickets.length, tickets }, options.format);
  } catch (error) {
    spinner.fail("Failed to search tickets");
    handleIntercomError(error);
  }
}

export async function cmdTicketReply(options: TicketReplyOptions): Promise<void> {
  const body = await resolveReplyBody({
    body: options.body,
    bodyFile: options.bodyFile,
    bodyFormat: options.bodyFormat,
  });
  const token = await requireToken(options.configDir);
  const spinner = ora("Sending reply...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const result = await client.tickets.reply({
      ticket_id: options.id,
      body: buildAdminReplyPayload({
        adminId: options.adminId,
        body,
        messageType: options.messageType,
        json: options.json,
      }),
    });

    spinner.succeed("Reply sent");

    output(
      {
        type: result.type,
        id: result.id,
        part_type: result.part_type,
        body: result.body,
        created_at: result.created_at,
        author: result.author,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to send reply");
    handleIntercomError(error);
  }
}

export async function cmdTicketClose(options: TicketCloseOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Closing ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const ticket = await client.tickets.update({
      ticket_id: options.id,
      open: false,
      admin_id: Number.parseInt(options.adminId, 10),
    });

    spinner.succeed("Ticket closed");

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        open: ticket?.open,
        ticket_state: ticket?.ticket_state,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to close ticket");
    handleIntercomError(error);
  }
}

export async function cmdTicketAssign(options: TicketAssignOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Assigning ticket...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const ticket = await client.tickets.update({
      ticket_id: options.id,
      assignee_id: options.assigneeId,
      admin_id: Number.parseInt(options.adminId, 10),
    });

    spinner.succeed("Ticket assigned");

    output(
      {
        id: ticket?.id,
        ticket_id: ticket?.ticket_id,
        admin_assignee_id: ticket?.admin_assignee_id,
        team_assignee_id: ticket?.team_assignee_id,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to assign ticket");
    handleIntercomError(error);
  }
}
