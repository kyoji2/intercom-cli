import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface ContactCreateOptions extends GlobalOptions {
  email?: string;
  name?: string;
  phone?: string;
  userId?: string;
  json?: string;
}

export interface ContactGetOptions extends GlobalOptions {
  id: string;
}

export interface ContactUpdateOptions extends GlobalOptions {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  json?: string;
}

export interface ContactDeleteOptions extends GlobalOptions {
  id: string;
}

export interface ContactSearchOptions extends GlobalOptions {
  email?: string;
  json?: string;
  limit?: string;
}

export interface ContactListOptions extends GlobalOptions {
  limit?: string;
}

export interface ContactNoteOptions extends GlobalOptions {
  id: string;
  body: string;
}

export interface ContactNotesListOptions extends GlobalOptions {
  id: string;
}

export interface ContactTagOptions extends GlobalOptions {
  contactId: string;
  tagId: string;
}

export interface ContactAttachCompanyOptions extends GlobalOptions {
  contactId: string;
  companyId: string;
}

async function requireToken(): Promise<string> {
  const token = await getTokenAsync();
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdContactCreate(options: ContactCreateOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Creating contact...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let payload: Record<string, unknown>;
    if (options.json) {
      payload = JSON.parse(options.json);
    } else {
      payload = {};
      if (options.email) payload.email = options.email;
      if (options.name) payload.name = options.name;
      if (options.phone) payload.phone = options.phone;
      if (options.userId) payload.external_id = options.userId;
    }

    const createPayload = { ...payload, role: (payload.role as string) ?? "user" };
    const contact = await client.contacts.create(createPayload as Parameters<typeof client.contacts.create>[0]);

    spinner.succeed("Contact created");

    output(
      {
        id: contact.id,
        external_id: contact.external_id,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        role: contact.role,
        created_at: contact.created_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to create contact");
    handleIntercomError(error);
  }
}

export async function cmdContactGet(options: ContactGetOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Fetching contact...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const contact = await client.contacts.find({ contact_id: options.id });

    spinner.stop();

    output(
      {
        id: contact.id,
        external_id: contact.external_id,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        role: contact.role,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        signed_up_at: contact.signed_up_at,
        last_seen_at: contact.last_seen_at,
        custom_attributes: contact.custom_attributes,
        tags: contact.tags,
        companies: contact.companies,
        location: contact.location,
        social_profiles: contact.social_profiles,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch contact");
    handleIntercomError(error);
  }
}

export async function cmdContactUpdate(options: ContactUpdateOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Updating contact...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let payload: Record<string, unknown> = { contact_id: options.id };
    if (options.json) {
      const parsed = JSON.parse(options.json);
      payload = { ...payload, ...parsed };
    } else {
      if (options.name) payload.name = options.name;
      if (options.email) payload.email = options.email;
      if (options.phone) payload.phone = options.phone;
    }

    const updatePayload = { contact_id: options.id, ...payload } as const;
    const contact = await client.contacts.update(updatePayload);

    spinner.succeed("Contact updated");

    output(
      {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        updated_at: contact.updated_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to update contact");
    handleIntercomError(error);
  }
}

export async function cmdContactDelete(options: ContactDeleteOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Deleting contact...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.contacts.delete({ contact_id: options.id });

    spinner.succeed("Contact deleted");

    output({ deleted: true, id: result.id }, options.format);
  } catch (error) {
    spinner.fail("Failed to delete contact");
    handleIntercomError(error);
  }
}

export async function cmdContactSearch(options: ContactSearchOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Searching contacts...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let query: Record<string, unknown>;
    if (options.json) {
      query = JSON.parse(options.json);
    } else if (options.email) {
      query = {
        query: {
          field: "email",
          operator: "=",
          value: options.email,
        },
      };
    } else {
      throw new CLIError("Search requires --email or --json", 400);
    }

    if (options.limit) {
      query.pagination = { per_page: Number.parseInt(options.limit, 10) };
    }

    const searchPayload = { query: query.query, pagination: query.pagination };
    const result = await client.contacts.search(searchPayload as Parameters<typeof client.contacts.search>[0]);

    spinner.stop();

    const contacts: unknown[] = [];
    for await (const contact of result) {
      contacts.push({
        id: contact.id,
        email: contact.email,
        name: contact.name,
        role: contact.role,
        created_at: contact.created_at,
      });
      if (options.limit && contacts.length >= Number.parseInt(options.limit, 10)) break;
    }

    output({ total: contacts.length, contacts }, options.format);
  } catch (error) {
    spinner.fail("Failed to search contacts");
    handleIntercomError(error);
  }
}

export async function cmdContactList(options: ContactListOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Listing contacts...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const limit = options.limit ? Number.parseInt(options.limit, 10) : 25;
    const result = await client.contacts.list({ per_page: Math.min(limit, 50) });

    spinner.stop();

    const contacts: unknown[] = [];
    for await (const contact of result) {
      contacts.push({
        id: contact.id,
        email: contact.email,
        name: contact.name,
        role: contact.role,
        created_at: contact.created_at,
      });
      if (contacts.length >= limit) break;
    }

    output({ total: contacts.length, contacts }, options.format);
  } catch (error) {
    spinner.fail("Failed to list contacts");
    handleIntercomError(error);
  }
}

export async function cmdContactNote(options: ContactNoteOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Adding note...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const note = await client.notes.create({
      contact_id: options.id,
      body: options.body,
    });

    spinner.succeed("Note added");

    output(
      {
        id: note.id,
        body: note.body,
        created_at: note.created_at,
        author: note.author,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to add note");
    handleIntercomError(error);
  }
}

export async function cmdContactNotes(options: ContactNotesListOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Fetching notes...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.notes.list({ contact_id: options.id });

    spinner.stop();

    const notes: unknown[] = [];
    for await (const note of result) {
      notes.push({
        id: note.id,
        body: note.body,
        created_at: note.created_at,
        author: note.author,
      });
    }

    output({ total: notes.length, notes }, options.format);
  } catch (error) {
    spinner.fail("Failed to fetch notes");
    handleIntercomError(error);
  }
}

export async function cmdContactTag(options: ContactTagOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Tagging contact...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.tags.tagContact({
      contact_id: options.contactId,
      id: options.tagId,
    });

    spinner.succeed("Contact tagged");

    output(
      {
        id: result.id,
        name: result.name,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to tag contact");
    handleIntercomError(error);
  }
}

export async function cmdContactUntag(options: ContactTagOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Removing tag...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.tags.untagContact({
      contact_id: options.contactId,
      tag_id: options.tagId,
    });

    spinner.succeed("Tag removed");

    output(
      {
        id: result.id,
        name: result.name,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to remove tag");
    handleIntercomError(error);
  }
}

export async function cmdContactAttachCompany(options: ContactAttachCompanyOptions): Promise<void> {
  const token = await requireToken();
  const spinner = ora("Attaching company...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.companies.attachContact({
      contact_id: options.contactId,
      id: options.companyId,
    });

    spinner.succeed("Company attached");

    output(
      {
        id: result.id,
        name: result.name,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to attach company");
    handleIntercomError(error);
  }
}
