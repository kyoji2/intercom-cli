# Intercom CLI Command Reference

## Global Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Log actions without making API calls |
| `-f, --format <format>` | Output format: `toon` (default) or `json` |
| `-v, --version` | Show version |
| `-h, --help` | Show help |

---

## Authentication Commands

### `intercom login [token]`

Login with your Intercom Access Token.

```bash
intercom login                   # Interactive prompt
intercom login "your_token"      # Direct token
```

### `intercom logout`

Remove stored credentials.

```bash
intercom logout
```

### `intercom whoami`

Show current admin and workspace info.

```bash
intercom whoami
```

### `intercom context`

Show account context including admins and workspace.

```bash
intercom context
```

### `intercom schema`

Output API schemas and usage examples (for AI context).

```bash
intercom schema
```

---

## Contact Commands

### `intercom contact create`

Create a new contact.

| Option | Description |
|--------|-------------|
| `--email <email>` | Contact email |
| `--name <name>` | Contact name |
| `--phone <phone>` | Contact phone |
| `--user-id <id>` | External user ID |
| `--json <json>` | Full contact data as JSON |

```bash
intercom contact create --email "user@example.com" --name "John Doe"
intercom contact create --json '{"email":"user@example.com","custom_attributes":{"plan":"premium"}}'
```

### `intercom contact get <id>`

Get contact details.

```bash
intercom contact get 6789abc
```

### `intercom contact update <id>`

Update a contact.

| Option | Description |
|--------|-------------|
| `--name <name>` | New name |
| `--email <email>` | New email |
| `--phone <phone>` | New phone |
| `--json <json>` | Update data as JSON |

```bash
intercom contact update 6789abc --name "Jane Doe"
intercom contact update 6789abc --json '{"custom_attributes":{"status":"active"}}'
```

### `intercom contact delete <id>`

Delete a contact.

```bash
intercom contact delete 6789abc
```

### `intercom contact search`

Search contacts.

| Option | Description |
|--------|-------------|
| `--email <email>` | Search by email |
| `--json <json>` | Search query as JSON |
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom contact search --email "user@example.com"
intercom contact search --json '{"query":{"field":"name","operator":"~","value":"John"}}'
```

### `intercom contact list`

List contacts.

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom contact list --limit 50
```

### `intercom contact note <id> <body>`

Add a note to contact.

```bash
intercom contact note 6789abc "Customer interested in enterprise plan"
```

### `intercom contact notes <id>`

List contact notes.

```bash
intercom contact notes 6789abc
```

### `intercom contact tag <contact-id> <tag-id>`

Add tag to contact.

```bash
intercom contact tag 6789abc 12345
```

### `intercom contact untag <contact-id> <tag-id>`

Remove tag from contact.

```bash
intercom contact untag 6789abc 12345
```

### `intercom contact attach-company <contact-id> <company-id>`

Attach contact to company.

```bash
intercom contact attach-company 6789abc company123
```

---

## Conversation Commands

### `intercom conversation list`

List conversations.

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom conversation list --limit 50
```

### `intercom conversation get <id>`

Get conversation details.

```bash
intercom conversation get 12345
```

### `intercom conversation search`

Search conversations.

| Option | Description |
|--------|-------------|
| `--state <state>` | Filter by state (open, closed, snoozed) |
| `--assignee <id>` | Filter by assignee admin ID |
| `--json <json>` | Search query as JSON |
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom conversation search --state open
intercom conversation search --assignee 12345
```

### `intercom conversation reply <id>`

Reply to a conversation.

| Option | Description | Required |
|--------|-------------|----------|
| `--admin <id>` | Admin ID sending reply | Yes |
| `--body <body>` | Reply message | Yes |
| `--json <json>` | Additional data as JSON | No |

```bash
intercom conversation reply 12345 --admin 67890 --body "Thank you for reaching out!"
```

### `intercom conversation assign <id>`

Assign conversation to admin/team.

| Option | Description | Required |
|--------|-------------|----------|
| `--admin <id>` | Admin performing assignment | Yes |
| `--assignee <id>` | Assignee ID | Yes |

```bash
intercom conversation assign 12345 --admin 67890 --assignee 11111
```

### `intercom conversation close <id>`

Close a conversation.

| Option | Description | Required |
|--------|-------------|----------|
| `--admin <id>` | Admin closing conversation | Yes |

```bash
intercom conversation close 12345 --admin 67890
```

### `intercom conversation open <id>`

Reopen a conversation.

| Option | Description | Required |
|--------|-------------|----------|
| `--admin <id>` | Admin opening conversation | Yes |

```bash
intercom conversation open 12345 --admin 67890
```

### `intercom conversation snooze <id>`

Snooze a conversation.

| Option | Description | Required |
|--------|-------------|----------|
| `--admin <id>` | Admin snoozing conversation | Yes |
| `--until <timestamp>` | Unix timestamp to snooze until | Yes |

```bash
intercom conversation snooze 12345 --admin 67890 --until 1735689600
```

---

## Company Commands

### `intercom company create`

Create a company.

| Option | Description | Required |
|--------|-------------|----------|
| `--company-id <id>` | Unique company identifier | Yes |
| `--name <name>` | Company name | Yes |
| `--plan <plan>` | Company plan | No |
| `--size <size>` | Company size | No |
| `--website <url>` | Company website | No |
| `--json <json>` | Additional data as JSON | No |

```bash
intercom company create --company-id "acme-123" --name "Acme Corp" --plan "enterprise"
```

### `intercom company get <id>`

Get company details.

```bash
intercom company get acme-123
```

### `intercom company list`

List companies.

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom company list --limit 50
```

### `intercom company update <id>`

Update a company.

| Option | Description | Required |
|--------|-------------|----------|
| `--json <json>` | Update data as JSON | Yes |

```bash
intercom company update acme-123 --json '{"plan":"enterprise","size":100}'
```

---

## Tag Commands

### `intercom tag list`

List all tags.

```bash
intercom tag list
```

### `intercom tag create <name>`

Create a tag.

```bash
intercom tag create "VIP Customer"
```

### `intercom tag get <id>`

Get tag details.

```bash
intercom tag get 12345
```

### `intercom tag delete <id>`

Delete a tag.

```bash
intercom tag delete 12345
```

---

## Article Commands

### `intercom article list`

List articles.

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom article list --limit 50
```

### `intercom article get <id>`

Get article details.

```bash
intercom article get 12345
```

### `intercom article search <query>`

Search articles.

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |

```bash
intercom article search "getting started" --limit 10
```

### `intercom article create`

Create an article.

| Option | Description | Required |
|--------|-------------|----------|
| `--title <title>` | Article title | Yes |
| `--author-id <id>` | Author admin ID | Yes |
| `--body <body>` | Article body (HTML) | No |
| `--description <desc>` | Article description | No |
| `--state <state>` | Article state (draft, published) | No |
| `--parent-id <id>` | Parent collection/section ID | No |
| `--parent-type <type>` | Parent type (collection, section) | No |

```bash
intercom article create --title "Getting Started" --author-id 12345 --body "<h1>Welcome</h1>"
```

### `intercom article update <id>`

Update an article.

| Option | Description | Required |
|--------|-------------|----------|
| `--json <json>` | Update data as JSON | Yes |

```bash
intercom article update 12345 --json '{"title":"Updated Title","state":"published"}'
```

### `intercom article delete <id>`

Delete an article.

```bash
intercom article delete 12345
```

---

## Admin Commands

### `intercom admin list`

List all admins in workspace.

```bash
intercom admin list
```

### `intercom admin get <id>`

Get admin details.

```bash
intercom admin get 12345
```

---

## Event Commands

### `intercom event track`

Track a custom event.

| Option | Description | Required |
|--------|-------------|----------|
| `--name <name>` | Event name | Yes |
| `--user-id <id>` | User ID | One of user-id or email |
| `--email <email>` | User email | One of user-id or email |
| `--metadata <json>` | Event metadata as JSON | No |

```bash
intercom event track --name "purchase" --user-id "user123"
intercom event track --name "upgrade" --email "user@example.com" --metadata '{"plan":"premium","amount":99}'
```

### `intercom event list`

List events for a user.

| Option | Description | Required |
|--------|-------------|----------|
| `--user-id <id>` | User ID | Yes |

```bash
intercom event list --user-id "user123"
```
