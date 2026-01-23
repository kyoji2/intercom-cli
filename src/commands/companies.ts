import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface CompanyCreateOptions extends GlobalOptions {
  companyId: string;
  name: string;
  plan?: string;
  size?: string;
  website?: string;
  json?: string;
}

export interface CompanyGetOptions extends GlobalOptions {
  id: string;
}

export interface CompanyListOptions extends GlobalOptions {
  limit?: string;
}

export interface CompanyUpdateOptions extends GlobalOptions {
  id: string;
  json: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdCompanyCreate(options: CompanyCreateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Creating company...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    let payload: Record<string, unknown> = {
      company_id: options.companyId,
      name: options.name,
    };

    if (options.json) {
      const parsed = JSON.parse(options.json);
      payload = { ...payload, ...parsed };
    } else {
      if (options.plan) payload.plan = options.plan;
      if (options.size) payload.size = Number.parseInt(options.size, 10);
      if (options.website) payload.website = options.website;
    }

    const company = await client.companies.createOrUpdate(
      payload as Parameters<typeof client.companies.createOrUpdate>[0],
    );

    spinner.succeed("Company created");

    output(
      {
        id: company.id,
        company_id: company.company_id,
        name: company.name,
        plan: company.plan,
        size: company.size,
        website: company.website,
        created_at: company.created_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to create company");
    handleIntercomError(error);
  }
}

export async function cmdCompanyGet(options: CompanyGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching company...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const company = await client.companies.find({ company_id: options.id });

    spinner.stop();

    output(
      {
        id: company.id,
        company_id: company.company_id,
        name: company.name,
        plan: company.plan,
        size: company.size,
        website: company.website,
        industry: company.industry,
        created_at: company.created_at,
        updated_at: company.updated_at,
        session_count: company.session_count,
        user_count: company.user_count,
        monthly_spend: company.monthly_spend,
        custom_attributes: company.custom_attributes,
        tags: company.tags,
        segments: company.segments,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch company");
    handleIntercomError(error);
  }
}

export async function cmdCompanyList(options: CompanyListOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Listing companies...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const limit = options.limit ? Number.parseInt(options.limit, 10) : 25;

    const result = await client.companies.list({ per_page: Math.min(limit, 50) });

    spinner.stop();

    const companies: unknown[] = [];
    for await (const company of result) {
      companies.push({
        id: company.id,
        company_id: company.company_id,
        name: company.name,
        plan: company.plan,
        size: company.size,
        user_count: company.user_count,
        created_at: company.created_at,
      });
      if (companies.length >= limit) break;
    }

    output({ total: companies.length, companies }, options.format);
  } catch (error) {
    spinner.fail("Failed to list companies");
    handleIntercomError(error);
  }
}

export async function cmdCompanyUpdate(options: CompanyUpdateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Updating company...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const parsed = JSON.parse(options.json);
    const payload = { company_id: options.id, ...parsed };

    const company = await client.companies.update(payload as Parameters<typeof client.companies.update>[0]);

    spinner.succeed("Company updated");

    output(
      {
        id: company.id,
        company_id: company.company_id,
        name: company.name,
        updated_at: company.updated_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to update company");
    handleIntercomError(error);
  }
}
