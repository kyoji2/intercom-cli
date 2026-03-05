---
name: intercom
description: Intercom CLI for managing customer conversations, contacts, companies, tickets, and help center articles. Use this skill to create contacts, search customers, reply to conversations, manage tickets, track events, and access knowledge base content.
license: MIT
compatibility: Requires Bun runtime (v1.0+) and Intercom account with API token
metadata:
  author: kyoji2
  homepage: https://github.com/kyoji2/intercom-cli
  version: "1.2"
---

# Intercom CLI

AI-native CLI for Intercom customer support operations. All commands support `--dry-run` for safe testing and `--format json` for structured output.

## Quick Reference

```bash
# Authentication
intercom login [token]        # Save access token
intercom whoami               # Current admin info
intercom context              # Workspace overview

# Core operations
intercom contact search --email "user@example.com"
intercom conversation search --state open
intercom ticket search --state open
intercom ticket-type list
```

## Installation

```bash
bun install -g @kyoji2/intercom-cli
```

## Authentication Setup

### Getting an API Token

1. Log in to [Intercom](https://app.intercom.com/)
2. Go to **Settings** → **Developers** → **Developer Hub**
3. Create a new app or select existing
4. Go to **Configure** → **Authentication**
5. Copy the **Access Token**

### Login

```bash
intercom login                   # Interactive prompt for token
intercom login "your_token"      # Provide token directly
```

Token is stored in `~/.config/intercom-cli/config.json`. You can also use environment variable:

```bash
export INTERCOM_ACCESS_TOKEN="your_token"
```

### Verify Authentication

```bash
intercom whoami                  # Show current admin ID, name, email
intercom context                 # Show workspace info and team members
```

## Commands Overview

| Resource | Commands |
|----------|----------|
| `contact` | create, get, update, delete, search, list, note, notes, tag, untag, attach-company |
| `conversation` | list, get, search, reply, assign, close, open, snooze, convert |
| `ticket` | create, get, update, delete, search, reply, close, assign |
| `ticket-type` | list, get |
| `company` | create, get, list, update |
| `tag` | list, create, get, delete |
| `article` | list, get, search, create, update, delete |
| `admin` | list, get |
| `event` | track, list |

## Contacts

```bash
intercom contact search --email "user@example.com"
intercom contact search --json '{"query":{"field":"name","operator":"~","value":"John"}}'
intercom contact list --limit 50

intercom contact create --email "user@example.com" --name "John Doe"
intercom contact create --json '{"email":"user@example.com","custom_attributes":{"plan":"premium"}}'

intercom contact update <id> --name "New Name"
intercom contact update <id> --json '{"custom_attributes":{"status":"active"}}'

intercom contact delete <id>

intercom contact note <id> "Note body"
intercom contact notes <id>

intercom contact tag <contact-id> <tag-id>
intercom contact untag <contact-id> <tag-id>
intercom contact attach-company <contact-id> <company-id>
```

## Conversations

```bash
intercom conversation list --limit 50
intercom conversation get <id>

intercom conversation search --state open
intercom conversation search --state closed
intercom conversation search --assignee <admin-id>
intercom conversation search --json '{"query":{"field":"state","operator":"=","value":"open"}}'

intercom conversation reply <id> --admin <admin-id> --body "Message"
intercom conversation reply <id> --admin <admin-id> --body "Internal note" --type note
intercom conversation reply <id> --admin <admin-id> --body "Internal note" --json '{"message_type":"note"}'
intercom conversation assign <id> --admin <admin-id> --assignee <assignee-id>
intercom conversation close <id> --admin <admin-id>
intercom conversation open <id> --admin <admin-id>
intercom conversation snooze <id> --admin <admin-id> --until <unix-timestamp>

# Convert conversation to ticket (requires ticket type ID)
intercom conversation convert <id> --type-id <ticket-type-id>
intercom conversation convert <id> --type-id <ticket-type-id> --title "Bug Report" --description "Details"
```

For `conversation reply`, message type precedence is `--type` > `--json.message_type` > `comment`.

## Tickets

```bash
# List ticket types first to get type IDs
intercom ticket-type list
intercom ticket-type get <id>

# Create ticket (requires ticket type ID and contact ID)
intercom ticket create --type-id <ticket-type-id> --contact-id <contact-id> --title "Issue" --description "Details"
intercom ticket create --json '{"ticket_type_id":"123","contacts":[{"id":"abc"}]}'

# Read and search
intercom ticket get <id>
intercom ticket search --state open
intercom ticket search --state closed
intercom ticket search --assignee <admin-id>
intercom ticket search --json '{"query":{"field":"open","operator":"=","value":true}}'

# Update ticket
intercom ticket update <id> --state-id <state-id>
intercom ticket update <id> --assignee-id <admin-or-team-id>
intercom ticket update <id> --closed
intercom ticket update <id> --json '{"ticket_attributes":{"_default_title_":"Updated"}}'

# Reply (comment visible to customer, note internal only)
intercom ticket reply <id> --admin <admin-id> --body "We're investigating"
intercom ticket reply <id> --admin <admin-id> --body "Internal note" --type note
intercom ticket reply <id> --admin <admin-id> --body "Internal note" --json '{"message_type":"note"}'

# Workflow actions
intercom ticket close <id> --admin <admin-id>
intercom ticket assign <id> --admin <admin-id> --assignee <assignee-id>

# Delete
intercom ticket delete <id>
```

For `ticket reply`, message type precedence is `--type` > `--json.message_type` > `comment`.

## Companies

```bash
intercom company list --limit 100
intercom company get <id>
intercom company create --company-id "acme-123" --name "Acme Corp"
intercom company create --company-id "acme" --name "Acme" --plan "enterprise" --size 500
intercom company update <id> --json '{"plan":"enterprise","size":100}'
```

## Tags

```bash
intercom tag list
intercom tag get <id>
intercom tag create "VIP Customer"
intercom tag delete <id>
```

## Articles

```bash
intercom article list --limit 50
intercom article get <id>
intercom article search "getting started"
intercom article create --title "Title" --author-id <admin-id> --body "<p>Content</p>"
intercom article update <id> --json '{"title":"Updated","state":"published"}'
intercom article delete <id>
```

## Admins

```bash
intercom admin list
intercom admin get <id>
```

## Events

```bash
intercom event track --name "purchase" --user-id "user123"
intercom event track --name "signup" --email "user@example.com"
intercom event track --name "upgrade" --user-id "user123" --metadata '{"plan":"premium"}'
intercom event list --user-id "user123"
```

## Search Query Syntax

### Operators

| Operator | Description |
|----------|-------------|
| `=` | Equals |
| `!=` | Not equals |
| `<`, `>`, `<=`, `>=` | Comparison |
| `IN`, `NIN` | In / Not in list |
| `~`, `!~` | Contains / Does not contain |

### Combining Queries

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

```bash
--dry-run              # Test without making API calls
--format json          # JSON output (default: toon)
-h, --help             # Show help
-v, --version          # Show version
```

## Error Handling

| Status | Meaning | Resolution |
|--------|---------|------------|
| 401 | Unauthorized | Run `intercom login` |
| 404 | Not Found | Verify ID is correct |
| 429 | Rate Limited | Wait before retrying |

## Common Workflows

### Customer Onboarding
```bash
intercom contact create --email "new@company.com" --name "New Customer"
intercom contact attach-company <contact-id> <company-id>
intercom contact tag <contact-id> <tag-id>
intercom contact note <contact-id> "Onboarding notes"
```

### Ticket Management
```bash
intercom ticket-type list                                    # Get available types
intercom ticket create --type-id 123 --contact-id abc --title "Bug Report"
intercom ticket reply <id> --admin <admin-id> --body "We're looking into this"
intercom ticket assign <id> --admin <admin-id> --assignee <team-id>
intercom ticket close <id> --admin <admin-id>
```

### Support Triage
```bash
intercom conversation search --state open
intercom conversation reply <id> --admin <admin-id> --body "Thanks for reaching out!"
intercom conversation close <id> --admin <admin-id>
```
