# Ganglion

A [Pi coding agent](https://github.com/mariozechner/pi-coding-agent) package extending Pi with integrations for Jira, Obsidian, Scryfall (MTG), and profile management.

## ⚠️ Stability

This is my personal toolbox. I make **no stability guarantees** — APIs, tool names, behaviors, and configuration formats may change at any time without notice. Use at your own risk (or better yet, don't — fork it instead).

## Extensions

### Profile Switching (`extensions/profile.ts`)

Load named profiles from `~/.pi/profiles/` to switch models, system prompts, and active tools on the fly.

### Jira Cloud (`extensions/jira.ts`)

Create issues, list issues in epics, and see tickets in your current sprint. Hard-wired to my Jira instance — you'll need to adjust for yours.

Requires environment variables:
- `ATLASSIAN_USERNAME`
- `ATLASSIAN_API_KEY`
- `JIRA_URL`

### Obsidian (`extensions/obsidian.ts`)

Read today's daily journal and find open todo items across your vault using ripgrep.

Requires `~/.pi/ganglion.json` with an `obsidian.directory` setting.

### Scryfall (`extensions/scryfall.ts`)

Look up Magic: The Gathering cards by name via the [Scryfall API](https://scryfall.com/docs/api).

## Installation

```bash
pi add ganglion
```

## Configuration

Create `~/.pi/ganglion.json`:

```json
{
  "obsidian": {
    "directory": "/path/to/your/obsidian/vault"
  }
}
```

## License

MIT
