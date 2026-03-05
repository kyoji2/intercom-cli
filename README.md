# Intercom CLI

AI-native CLI for Intercom - manage customer conversations, contacts, messages, and support.

## Installation

### From npm (recommended)

```bash
bun install -g @kyoji2/intercom-cli
```

### From source

```bash
git clone https://github.com/kyoji2/intercom-cli.git
cd intercom-cli
bun install
bun link
```

### Verify installation

```bash
intercom --version
```

## Prerequisites

- **Bun runtime** (v1.0 or later) - [Install Bun](https://bun.sh)
- **Intercom account** with API access token

### Getting an Access Token

1. Log in to your [Intercom workspace](https://app.intercom.com/)
2. Navigate to **Settings** → **Developers** → **Developer Hub**
3. Create a new app or select an existing one
4. Go to **Configure** → **Authentication**
5. Copy your **Access Token**

## Quick Start

```bash
# Authentication
intercom login [token]           # Login with your access token
intercom whoami                  # Show current admin and workspace
intercom logout                  # Remove credentials

# Get context about the account
intercom context                 # Admin info and workspace details
intercom schema                  # Show API schemas (for AI context)

# Manage contacts
intercom contact list            # List contacts
intercom contact search --email "user@example.com"
intercom contact create --email "new@example.com" --name "John Doe"
intercom contact get <id>
intercom contact update <id> --name "New Name"
intercom contact delete <id>

# Manage conversations
intercom conversation list
intercom conversation search --state open
intercom conversation get <id>
intercom conversation reply <id> --admin <admin-id> --body "Internal triage note" --type note
intercom conversation close <id> --admin <admin-id>

# Manage companies
intercom company create --company-id "acme" --name "Acme Corp"
intercom company list
intercom company get <id>

# Manage tags
intercom tag list
intercom tag create "VIP Customer"

# Help center articles
intercom article list
intercom article search "getting started"
intercom article get <id>

# Track events
intercom event track --name "purchase" --user-id "user123"

# Manage tickets
intercom ticket create --type-id 1234 --contact-id abc123 --title "Issue"
intercom ticket search --state open
intercom ticket get <id>
intercom ticket reply <id> --admin <admin-id> --body "We're on it!" --type comment
intercom ticket reply <id> --admin <admin-id> --body "Internal note" --json '{"message_type":"note"}'
intercom ticket close <id> --admin <admin-id>

# List ticket types
intercom ticket-type list
```

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `intercom login [token]` | Save access token (prompts if not provided) |
| `intercom logout` | Remove stored credentials |
| `intercom whoami` | Show current admin and workspace info |
| `intercom context` | Show account context (admins, workspace) |
| `intercom schema` | Output API schemas for AI context |

### Contacts

| Command | Description |
|---------|-------------|
| `intercom contact create` | Create a new contact |
| `intercom contact get <id>` | Get contact details |
| `intercom contact update <id>` | Update a contact |
| `intercom contact delete <id>` | Delete a contact |
| `intercom contact search` | Search contacts |
| `intercom contact list` | List contacts |
| `intercom contact note <id> <body>` | Add note to contact |
| `intercom contact notes <id>` | List contact notes |
| `intercom contact tag <id> <tag-id>` | Tag a contact |
| `intercom contact untag <id> <tag-id>` | Remove tag from contact |
| `intercom contact attach-company <id> <company-id>` | Attach contact to company |

### Conversations

| Command | Description |
|---------|-------------|
| `intercom conversation list` | List conversations |
| `intercom conversation get <id>` | Get conversation details |
| `intercom conversation search` | Search conversations |
| `intercom conversation reply <id>` | Reply to conversation |
| `intercom conversation assign <id>` | Assign conversation |
| `intercom conversation close <id>` | Close conversation |
| `intercom conversation open <id>` | Reopen conversation |
| `intercom conversation snooze <id>` | Snooze conversation |
| `intercom conversation convert <id>` | Convert conversation to ticket |

`intercom conversation reply` supports `--type <comment|note>` and `--json <json>`.  
Message type precedence: `--type` > `--json.message_type` > `comment`.

### Companies

| Command | Description |
|---------|-------------|
| `intercom company create` | Create a company |
| `intercom company get <id>` | Get company details |
| `intercom company list` | List companies |
| `intercom company update <id>` | Update a company |

### Tags

| Command | Description |
|---------|-------------|
| `intercom tag list` | List all tags |
| `intercom tag create <name>` | Create a tag |
| `intercom tag get <id>` | Get tag details |
| `intercom tag delete <id>` | Delete a tag |

### Articles

| Command | Description |
|---------|-------------|
| `intercom article list` | List articles |
| `intercom article get <id>` | Get article details |
| `intercom article search <query>` | Search articles |
| `intercom article create` | Create an article |
| `intercom article update <id>` | Update an article |
| `intercom article delete <id>` | Delete an article |

### Admins

| Command | Description |
|---------|-------------|
| `intercom admin list` | List all admins |
| `intercom admin get <id>` | Get admin details |

### Events

| Command | Description |
|---------|-------------|
| `intercom event track` | Track a custom event |
| `intercom event list` | List events for a user |

### Tickets

| Command | Description |
|---------|-------------|
| `intercom ticket create` | Create a new ticket |
| `intercom ticket get <id>` | Get ticket details |
| `intercom ticket update <id>` | Update a ticket |
| `intercom ticket delete <id>` | Delete a ticket |
| `intercom ticket search` | Search tickets |
| `intercom ticket reply <id>` | Reply to a ticket |
| `intercom ticket close <id>` | Close a ticket |
| `intercom ticket assign <id>` | Assign ticket to admin/team |

`intercom ticket reply` supports `--type <comment|note>` and `--json <json>`.  
Message type precedence: `--type` > `--json.message_type` > `comment`.

### Ticket Types

| Command | Description |
|---------|-------------|
| `intercom ticket-type list` | List all ticket types |
| `intercom ticket-type get <id>` | Get ticket type details |

## Global Options

All commands support:

```bash
--dry-run              # Log actions without making API calls
-f, --format <format>  # Output format: toon (default) or json
--config-dir <path>    # Config directory (default: ~/.config/intercom-cli)
-v, --version          # Show version
-h, --help             # Show help
```

## Output Formats

### TOON (Default)

Token-optimized format designed for AI agents:

```
field_name: value
another_field: value
```

### JSON

Standard JSON output with `--format json`:

```json
{
  "field_name": "value"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `INTERCOM_ACCESS_TOKEN` | Access token (takes priority over config file) |

## Configuration

Credentials are stored in `~/.config/intercom-cli/config.json`

## Development

```bash
# Run in development mode
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run typecheck

# Build
bun run build
```

## License

MIT
