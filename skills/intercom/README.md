# Intercom CLI Skill

This skill provides AI-native CLI access to Intercom for managing customer conversations, contacts, companies, messages, and support operations.

## Trigger Keywords

Use this skill when the user wants to:
- Create, update, search, or delete **contacts** (customers, users, leads)
- Manage **conversations** (reply, assign, close, open, snooze)
- Work with **companies** (create, update, list)
- Manage **tags** (create, delete, tag contacts)
- Access **help center articles** (list, search, create, update)
- Track **events** (custom user activities)
- List **admins** (team members)

## Key Commands

```bash
# Authentication
intercom login
intercom whoami
intercom context

# Contacts
intercom contact create --email <email> --name <name>
intercom contact search --email <email>
intercom contact get <id>
intercom contact update <id> --json '<json>'
intercom contact delete <id>
intercom contact tag <contact-id> <tag-id>
intercom contact note <id> "Note body"

# Conversations
intercom conversation list
intercom conversation search --state open
intercom conversation get <id>
intercom conversation reply <id> --admin <admin-id> --body "Message"
intercom conversation close <id> --admin <admin-id>
intercom conversation assign <id> --admin <admin-id> --assignee <id>

# Companies
intercom company create --company-id <id> --name <name>
intercom company get <id>
intercom company list

# Tags
intercom tag list
intercom tag create <name>

# Articles
intercom article list
intercom article search <query>
intercom article get <id>

# Events
intercom event track --name <name> --user-id <id>
```

## Prerequisites

- Bun runtime (v1.0+)
- Intercom account with API access token

## Installation

```bash
bun install -g @kyoji2/intercom-cli
intercom login
```
