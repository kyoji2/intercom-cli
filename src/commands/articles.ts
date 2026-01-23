import ora from "ora";
import { createClient, handleIntercomError } from "../client.ts";
import { CLIError, type GlobalOptions, getTokenAsync, output } from "../utils/index.ts";

export interface ArticleListOptions extends GlobalOptions {
  limit?: string;
}

export interface ArticleGetOptions extends GlobalOptions {
  id: string;
}

export interface ArticleSearchOptions extends GlobalOptions {
  query: string;
  limit?: string;
}

export interface ArticleCreateOptions extends GlobalOptions {
  title: string;
  authorId: string;
  body?: string;
  description?: string;
  state?: string;
  parentId?: string;
  parentType?: string;
}

export interface ArticleUpdateOptions extends GlobalOptions {
  id: string;
  json: string;
}

export interface ArticleDeleteOptions extends GlobalOptions {
  id: string;
}

async function requireToken(configDir: string): Promise<string> {
  const token = await getTokenAsync(configDir);
  if (!token) {
    throw new CLIError("Not logged in", 401, "Run 'intercom login' to authenticate.");
  }
  return token;
}

export async function cmdArticleList(options: ArticleListOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Listing articles...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const limit = options.limit ? Number.parseInt(options.limit, 10) : 25;

    const result = await client.articles.list({ per_page: Math.min(limit, 50) });

    spinner.stop();

    const articles: unknown[] = [];
    for await (const article of result) {
      articles.push({
        id: article.id,
        title: article.title,
        description: article.description,
        state: article.state,
        url: article.url,
        created_at: article.created_at,
        updated_at: article.updated_at,
      });
      if (articles.length >= limit) break;
    }

    output({ total: articles.length, articles }, options.format);
  } catch (error) {
    spinner.fail("Failed to list articles");
    handleIntercomError(error);
  }
}

export async function cmdArticleGet(options: ArticleGetOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Fetching article...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const article = await client.articles.find({ article_id: Number(options.id) });

    spinner.stop();

    output(
      {
        id: article.id,
        title: article.title,
        description: article.description,
        body: article.body,
        state: article.state,
        url: article.url,
        author_id: article.author_id,
        parent_id: article.parent_id,
        parent_type: article.parent_type,
        created_at: article.created_at,
        updated_at: article.updated_at,
        statistics: article.statistics,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to fetch article");
    handleIntercomError(error);
  }
}

export async function cmdArticleSearch(options: ArticleSearchOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Searching articles...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.articles.search({
      phrase: options.query,
      state: "published",
    });

    spinner.stop();

    const limit = options.limit ? Number.parseInt(options.limit, 10) : 25;
    const allArticles =
      (result.data?.articles as Array<{
        id?: string;
        title?: string;
        description?: string;
        url?: string;
        state?: string;
      }>) ?? [];
    const articles = allArticles.slice(0, limit).map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      state: article.state,
    }));

    output({ total: articles.length, articles }, options.format);
  } catch (error) {
    spinner.fail("Failed to search articles");
    handleIntercomError(error);
  }
}

export async function cmdArticleCreate(options: ArticleCreateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Creating article...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const payload: Record<string, unknown> = {
      title: options.title,
      author_id: Number(options.authorId),
    };

    if (options.body) payload.body = options.body;
    if (options.description) payload.description = options.description;
    if (options.state) payload.state = options.state;
    if (options.parentId) payload.parent_id = Number(options.parentId);
    if (options.parentType) payload.parent_type = options.parentType;

    const article = await client.articles.create(payload as Parameters<typeof client.articles.create>[0]);

    spinner.succeed("Article created");

    output(
      {
        id: article.id,
        title: article.title,
        state: article.state,
        url: article.url,
        created_at: article.created_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to create article");
    handleIntercomError(error);
  }
}

export async function cmdArticleUpdate(options: ArticleUpdateOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Updating article...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });

    const parsed = JSON.parse(options.json);
    const payload = { article_id: Number(options.id), ...parsed };

    const article = await client.articles.update(payload as Parameters<typeof client.articles.update>[0]);

    spinner.succeed("Article updated");

    output(
      {
        id: article.id,
        title: article.title,
        updated_at: article.updated_at,
      },
      options.format,
    );
  } catch (error) {
    spinner.fail("Failed to update article");
    handleIntercomError(error);
  }
}

export async function cmdArticleDelete(options: ArticleDeleteOptions): Promise<void> {
  const token = await requireToken(options.configDir);
  const spinner = ora("Deleting article...").start();

  try {
    const client = createClient({ token, dryRun: options.dryRun });
    const result = await client.articles.delete({ article_id: Number(options.id) });

    spinner.succeed("Article deleted");

    output({ deleted: true, id: result.id }, options.format);
  } catch (error) {
    spinner.fail("Failed to delete article");
    handleIntercomError(error);
  }
}
