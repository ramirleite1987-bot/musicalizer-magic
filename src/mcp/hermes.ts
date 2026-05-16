import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { register as registerNextInstrumentation } from "@/instrumentation";
import {
  createSongInputSchema,
  songStatusInputSchema,
} from "@/lib/music/song-input";
import {
  createSongFromPrompt,
  getSongStatus,
} from "@/lib/music/song-workflow";

const server = new McpServer({
  name: "musicalizer-hermes",
  version: "0.1.0",
});

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown MCP error";

  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

server.registerTool(
  "create_song",
  {
    title: "Create song",
    description:
      "Create a Musicalizer Magic track/version and optionally request Suno generation.",
    inputSchema: createSongInputSchema,
  },
  async (input) => {
    try {
      const result = await createSongFromPrompt(input);
      return textResult(result);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.registerTool(
  "get_song_status",
  {
    title: "Get song status",
    description:
      "Read a Musicalizer Magic version status and refresh Suno status when it is still generating.",
    inputSchema: songStatusInputSchema,
  },
  async (input) => {
    try {
      const result = await getSongStatus(input);
      return textResult(result);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.registerPrompt(
  "song_brief",
  {
    title: "Song brief",
    description:
      "Build a concise brief Hermes can pass to create_song from a musical direction.",
    argsSchema: {
      idea: z.string().trim().min(1),
      genre: z.string().trim().optional(),
    },
  },
  ({ idea, genre }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            "Create a Musicalizer Magic song from this direction.",
            genre ? `Genre: ${genre}` : null,
            `Direction: ${idea}`,
            "Use the create_song tool when the brief is ready.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  })
);

async function main() {
  loadEnvConfig(process.cwd());
  await registerNextInstrumentation();
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
