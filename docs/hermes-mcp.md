# Hermes MCP

Musicalizer Magic exposes a stdio MCP server for Hermes through
`src/mcp/hermes.ts`. It creates tracks and first versions through the same
database schema as the dashboard, then starts Suno generation when requested.

## Configure Hermes

Point Hermes at the project MCP config:

```json
{
  "mcpServers": {
    "musicalizer-hermes": {
      "command": "npm",
      "args": ["run", "--silent", "mcp:hermes"]
    }
  }
}
```

The MCP process needs the same environment as the app:

- `DATABASE_URL`
- `SUNO_API_KEY`
- `SUNO_API_BASE_URL` when using a non-default Suno endpoint
- `NEON_LOCAL_PROXY` when using the local Neon HTTP proxy

## Tools

- `create_song`: creates a track and version, validates prompt/style input, and
  starts Suno generation by default.
- `get_song_status`: checks a version and refreshes Suno status while it is
  generating.

Set `startGeneration` to `false` when Hermes should only create the draft.
