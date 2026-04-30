# AGENTS.md

## Project Overview

**Ganglion** is a [Pi coding agent](https://github.com/mariozechner/pi-coding-agent) package providing custom extensions, tools, skills, and themes. It extends Pi with integrations for Jira, Obsidian, Scryfall (MTG), and profile management.

- **Author**: Seth Curry
- **Package name**: `ganglion`
- **Type**: `module` (ESM)
- **Language**: TypeScript
- **Runtime**: Node.js (targets `esnext`)

## Project Structure

```
├── extensions/          # Pi extension entry points
│   ├── profile.ts       # Profile switching (system prompts, models, tools)
│   ├── jira.ts          # Jira Cloud integration tools
│   ├── obsidian.ts      # Obsidian vault integration tools
│   └── scryfall.ts      # MTG card lookup via Scryfall API
├── lib/                 # Shared utilities
│   ├── frontmatter.ts   # YAML frontmatter parser for markdown profiles
│   └── configuration.ts # Loads ~/.pi/ganglion.json config
├── skills/              # Pi skill definitions (if present)
├── prompts/             # Custom prompt templates (if present)
├── themes/              # Custom Pi themes (if present)
├── testdata/            # Test fixtures (Obsidian journal examples)
├── package.json         # Pi package manifest with pi.extensions, pi.skills, etc.
├── tsconfig.json        # TypeScript configuration
└── yarn.lock            # Dependency lockfile
```

## Tech Stack

- **TypeScript** with strict mode, ESM modules (`nodenext`), verbatim module syntax
- **Pi SDK**: `@mariozechner/pi-coding-agent` (`^0.70.2`)
- **Schema validation**: `@sinclair/typebox` (`^0.34.49`) for tool parameter definitions
- **Package manager**: Yarn

## Extension Details

### profile.ts — Profile Switching

Allows selecting named profiles (markdown files in `~/.pi/profiles/`) that specify:

- A **model** to switch to
- A **system prompt** (markdown content after frontmatter)
- **Active tools** to enable

Profiles use YAML frontmatter:

```markdown
---
model: "claude-sonnet-4-5"
tools: ["read", "bash", "edit", "write"]
---
You are an expert TypeScript developer...
```

Key hooks:
- `before_agent_start` — Injects the active profile's content as the system prompt, preserving Pi's dynamic tail (date, cwd, documentation references).
- Commands: `profile`, `list_profiles`, `system-prompt`, `active-tools`, `all-tools`

### jira.ts — Jira Integration

Provides tools for Jira Cloud via REST API v3:

| Tool | Description |
|------|-------------|
| `create_jira_issue` | Creates a story in project **OCTO** with standard custom fields (story points, rationale, definition of done). Optionally links to an epic. |
| `jira_issues_in_epic` | Lists issues in a given epic key. |
| `tickets_in_current_sprint` | Lists current user's issues in the active sprint. |

**Requirements**: Environment variables `ATLASSIAN_USERNAME`, `ATLASSIAN_API_KEY`, `JIRA_URL`.

**Hardcoded project**: OCTO (`project.key = "OCTO"`, `issuetype.id = "10101"`). Custom fields are specific to this Jira instance (10117, 11016, 11277).

### obsidian.ts — Obsidian Vault Integration

Provides tools for querying the user's Obsidian vault:

| Tool | Description |
|------|-------------|
| `get_todays_journal` | Reads `Journal/YYYY/MM/YYYY-MM-DD.md` from the configured notes directory. |
| `get_todo_items` | Uses `rg` (ripgrep) to find open `- [ ]` todo items across the vault. |

**Requires**: `rg` (ripgrep) installed; `~/.pi/ganglion.json` with `obsidian.directory` set.

### scryfall.ts — MTG Card Lookup

| Tool | Description |
|------|-------------|
| `scryfall_get_card_by_name` | Fetches a Magic: The Gathering card by name from the [Scryfall API](https://scryfall.com/docs/api). |

Returns the first matching card as JSON.

## Configuration

Extensions load configuration from `~/.pi/ganglion.json`:

```json
{
  "obsidian": {
    "directory": "/path/to/obsidian/vault"
  },
  "database": {
    "host": "...",
    "port": 5432,
    "user": "...",
    "password": "...",
    "database": "..."
  }
}
```

The `database` block is defined in the config schema but is not yet consumed by any extension (future use).

## Development Conventions

### TypeScript Style
- Strict mode enabled (`strict: true`)
- ESM modules only (`"type": "module"`, `module: "nodenext"`)
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `.ts` extensions required in relative imports (e.g., `import { x } from "../lib/foo.ts"`)
- `noUncheckedIndexedAccess` for safer array/record access
- `exactOptionalPropertyTypes` for precise optional handling
- `noEmit: true` with `allowImportingTsExtensions` — no build step, Pi runs TS directly

### Extension Pattern
Each extension file default-exports a function that receives the `ExtensionAPI`:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Register tools, commands, and hooks here
}
```

### Tool Registration
Tools use `@sinclair/typebox` for parameter schemas:

```typescript
pi.registerTool({
  name: "tool_name",
  label: "Human-readable label",
  description: "Description for the LLM",
  parameters: Type.Object({ ... }),
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    // Return { content: [...], details: {} }
  },
});
```

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@mariozechner/pi-coding-agent` | `^0.70.2` | Pi SDK — Extension API types and runtime |
| `@sinclair/typebox` | `^0.34.49` | Runtime type checking for tool parameters |
| `@types/node` | `^25.6.0` | Node.js type definitions (dev) |

## Adding a New Extension

1. Create a new file in `extensions/` (e.g., `extensions/my_tool.ts`)
2. Follow the pattern: default-export a function taking `ExtensionAPI`
3. Register tools with `pi.registerTool({...})` or commands with `pi.registerCommand(...)`
4. The extension is auto-discovered via `pi.extensions` in `package.json`
5. If shared utilities are needed, add them to `lib/`
6. Use `import type` for Pi SDK types, `Type.*` from TypeBox for parameters
7. Keep tool `name` as `snake_case` strings
