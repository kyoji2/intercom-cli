---
name: intercom
description: Intercom CLI for managing customer conversations, contacts, companies, messages, support tickets, and help center articles. Use this skill to create contacts, search customers, reply to conversations, close tickets, manage tags, track events, and access knowledge base content.
license: MIT
compatibility: Requires Bun runtime (v1.0+) and Intercom account with API token
metadata:
  author: kyoji2
  homepage: https://github.com/kyoji2/intercom-cli
  version: "1.0"
---

# Intercom CLI Assistant

Expert guidance for interacting with the IntercomCLI - a Bun-powered, AI-native CLI for managing your Intercom customer support operations.

## Overview

The IntercomCLI provides comprehensive command-line access to Intercom's customer communication platform with AI-friendly output formats. All commands support:
- **Output formats**: `toon` (token-optimized, default) or `json` (via `--format json`)
- **Dry-run mode**: Test commands safely with `--dry-run`
- **Official SDK**: Uses `intercom-client` for reliable API access

## Requirements & Installation

### Prerequisites
- **Bun runtime** (v1.0 or later) - [Install Bun](https://bun.sh)
- **Intercom account** with API access token

### Installation

**Option 1: Install from npm** (recommended)
```bash
bun install -g @kyoji2/intercom-cli
```

**Option 2: Install from source**
```bash
git clone https://github.com/kyoji2/intercom-cli.git
cd intercom-cli
bun install
bun link
```

**Verify installation:**
```bash
intercom --version
```

## Quick Start

```bash
# Authentication
intercom login [token]           # Login with access token
intercom whoami                  # Show current admin
intercom logout                  # Remove credentials

# Get context about the account
intercom context                 # Admin info, workspace details
intercom schema                  # Show API schemas (for AI)

# Manage contacts
intercom contact search --email "user@example.com"
intercom contact create --email "new@example.com" --name "John"
intercom contact get <id>

# Manage conversations  
intercom conversation list
intercom conversation reply <id> --admin <admin-id> --body "Thank you!"
intercom conversation close <id> --admin <admin-id>
```

## Authentication & Setup

### Login
```bash
intercom login                   # Interactive prompt
intercom login "your_token"      # Provide token directly
```

**Getting an API token**:
1. Log in to [Intercom](https://app.intercom.com/)
2. Go to **Settings** → **Developers** → **Developer Hub**
3. Create a new app or select existing
4. Copy the **Access Token**

### Check Current User
```bash
intercom whoami                  # Returns admin ID, name, email, workspace
```

### Account Context
```bash
intercom context                 # High-level overview:
                                 # - Current admin
                                 # - Workspace info
                                 # - Team members
```

## Working with Contacts

### Search Contacts
```bash
intercom contact search --email "user@example.com"
intercom contact search --json '{"query":{"field":"name","operator":"~","value":"John"}}'
intercom contact list --limit 50
```

### Create Contact
```bash
intercom contact create --email "user@example.com" --name "John Doe"
intercom contact create --email "user@example.com" --phone "+1234567890"
intercom contact create --json '{"email":"user@example.com","custom_attributes":{"plan":"premium"}}'
```

### Update Contact
```bash
intercom contact update <id> --name "New Name"
intercom contact update <id> --json '{"custom_attributes":{"status":"active"}}'
```

### Delete Contact
```bash
intercom contact delete <id>
```

### Contact Notes
```bash
intercom contact note <id> "Customer interested in enterprise plan"
intercom contact notes <id>      # List all notes
```

### Contact Tags
```bash
intercom contact tag <contact-id> <tag-id>
intercom contact untag <contact-id> <tag-id>
```

### Company Association
```bash
intercom contact attach-company <contact-id> <company-id>
```

## Working with Conversations

### List Conversations
```bash
intercom conversation list
intercom conversation list --limit 50
```

### Search Conversations
```bash
intercom conversation search --state open
intercom conversation search --state closed
intercom conversation search --assignee <admin-id>
intercom conversation search --json '{"query":{"field":"state","operator":"=","value":"open"}}'
```

### Get Conversation Details
```bash
intercom conversation get <id>   # Full details including:
                                 # - Messages
                                 # - Participants
                                 # - Tags, SLA status
```

### Reply to Conversation
```bash
intercom conversation reply <id> --admin <admin-id> --body "Thank you for your message!"
```

### Assign Conversation
```bash
intercom conversation assign <id> --admin <admin-id> --assignee <assignee-id>
```

### Close/Open Conversation
```bash
intercom conversation close <id> --admin <admin-id>
intercom conversation open <id> --admin <admin-id>
```

### Snooze Conversation
```bash
intercom conversation snooze <id> --admin <admin-id> --until <unix-timestamp>
```

## Working with Companies

### Create Company
```bash
intercom company create --company-id "acme-123" --name "Acme Corp"
intercom company create --company-id "acme" --name "Acme" --plan "enterprise" --size 500
```

### List Companies
```bash
intercom company list
intercom company list --limit 100
```

### Get Company
```bash
intercom company get <id>
```

### Update Company
```bash
intercom company update <id> --json '{"plan":"enterprise","size":100}'
```

## Working with Tags

### List Tags
```bash
intercom tag list
```

### Create Tag
```bash
intercom tag create "VIP Customer"
intercom tag create "High Priority"
```

### Delete Tag
```bash
intercom tag delete <id>
```

## Working with Articles

### List Articles
```bash
intercom article list
intercom article list --limit 50
```

### Search Articles
```bash
intercom article search "getting started"
intercom article search "how to install"
```

### Get Article
```bash
intercom article get <id>        # Full content including:
                                 # - Title, body
                                 # - Author
                                 # - Statistics
```

### Create Article
```bash
intercom article create --title "Getting Started" --author-id <admin-id> --body "<p>Welcome!</p>"
```

### Update Article
```bash
intercom article update <id> --json '{"title":"Updated Title","body":"<p>New content</p>"}'
```

### Delete Article
```bash
intercom article delete <id>
```

## Working with Admins

### List Admins
```bash
intercom admin list              # All team members
```

### Get Admin
```bash
intercom admin get <id>
```

## Tracking Events

### Track Event
```bash
intercom event track --name "purchase" --user-id "user123"
intercom event track --name "signup" --email "user@example.com"
intercom event track --name "upgrade" --user-id "user123" --metadata '{"plan":"premium","amount":99}'
```

### List Events
```bash
intercom event list --user-id "user123"
```

## Search Operators

Intercom search supports these operators:

| Operator | Description |
|----------|-------------|
| `=` | Equals |
| `!=` | Not equals |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |
| `IN` | In list |
| `NIN` | Not in list |
| `~` | Contains |
| `!~` | Does not contain |

### Query Operators

- `AND` - All conditions must match
- `OR` - Any condition can match

### Example Complex Search

```bash
intercom contact search --json '{
  "query": {
    "operator": "AND",
    "value": [
      {"field": "role", "operator": "=", "value": "user"},
      {"field": "custom_attributes.plan", "operator": "IN", "value": ["premium", "enterprise"]}
    ]
  }
}'
```

## Global Options

All commands support:

```bash
--dry-run                        # Log actions without making API calls
--format json                    # Output as JSON instead of TOON
--format toon                    # Token-optimized output (default)
-v, --version                    # Show version
-h, --help                       # Show help
```

## Output Formats

### TOON (Default)
Token-optimized format designed for AI agents:
```
field_name: value
another_field: value
nested.field: value
```

### JSON
Standard JSON output with `--format json`:
```json
{
  "field_name": "value",
  "nested": {"field": "value"}
}
```

## Best Practices

1. **Start with context**: Run `intercom context` to understand the account
2. **Search before creating**: Use `intercom contact search` to avoid duplicates
3. **Use dry-run**: Test destructive operations with `--dry-run` first
4. **Check schema**: Use `intercom schema` when building automation
5. **Handle rate limits**: Intercom allows 10,000 API calls per minute

## Error Handling

The CLI provides helpful error messages with hints:

- **401 Unauthorized**: Run `intercom login` to authenticate
- **404 Not Found**: Verify the ID is correct
- **429 Rate Limited**: Wait before retrying
- **Invalid JSON**: Ensure JSON is properly escaped for shell

All errors include:
- Error message
- HTTP status code
- Hint for resolution (when available)

## Examples

### Customer Onboarding Workflow
```bash
# Create new contact
intercom contact create --email "new@company.com" --name "New Customer"

# Add to company
intercom contact attach-company <contact-id> <company-id>

# Tag as new customer
intercom contact tag <contact-id> <new-customer-tag-id>

# Add internal note
intercom contact note <contact-id> "New enterprise customer - assigned to success team"
```

### Support Ticket Workflow
```bash
# Find open conversations
intercom conversation search --state open

# Reply to customer
intercom conversation reply <id> --admin <admin-id> --body "Thanks for reaching out. I can help with that!"

# Close resolved conversation
intercom conversation close <id> --admin <admin-id>
```

### VIP Customer Management
```bash
# Search for premium customers
intercom contact search --json '{"query":{"field":"custom_attributes.plan","operator":"=","value":"enterprise"}}'

# Tag as VIP
intercom contact tag <id> <vip-tag-id>
```

### Knowledge Base Management
```bash
# Search existing articles
intercom article search "how to"

# Create new article
intercom article create --title "How to Get Started" --author-id <admin-id> --body "<h1>Welcome</h1><p>Here's how to begin...</p>"

# Update article
intercom article update <id> --json '{"state":"published"}'
```

## Resources

See `references/commands.md` for detailed command reference.
