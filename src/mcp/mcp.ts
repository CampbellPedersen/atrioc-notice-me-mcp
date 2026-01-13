import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CheckChatOutputSchema, CheckRedditOutputSchema, SendChatMessageInputSchema } from "./types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { checkAtriocsStream } from "../services/check-atriocs-stream.js";
import { TwitchAuthInfo } from "../middleware/twitch-oauth.js";
import { sendMessageToAtrioc } from "../services/send-message-to-atrioc.js";
import { checkAtriocsSubreddit } from "../services/check-atriocs-subreddit.js";

export const getMcpServer = () => {
  const mcpServer = new McpServer({
    name: "Atrioc Notice Me MCP",
    version: "1.0.0",
  });

  mcpServer.registerTool(
    "check_stream",
    {
      title: "Check Atrioc's Stream",
      description: `Checks Atrioc's Twitch stream title, current streaming category and grab 3 seconds of chat messages. Then, use this information to come up with an original, funny stand-out message to send to his chat!`,
      outputSchema: CheckChatOutputSchema,
    },
    async ({authInfo}) => {
      // Should never hit this, middleware should populate this
      if (!authInfo) return {
        content: [
          {
            type: 'text',
            text: 'Unauthorized.',
          }
        ]
      }
      const streamInfo = await checkAtriocsStream(authInfo as TwitchAuthInfo);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(streamInfo),
          },
        ],
        structuredContent: streamInfo,
      };
    }
  );

    mcpServer.registerTool(
    "check_reddit",
    {
      description: `Checks Atrioc's subreddit for trending posts. Used to gain more context into the community and to grab posts to share with Atrioc and chat.`,
      title: "Check the /r/Atrioc subreddit",
      outputSchema: CheckRedditOutputSchema,
    },
    async ({authInfo}) => {
      // Should never hit this, middleware should populate this
      if (!authInfo) return {
        content: [
          {
            type: 'text',
            text: 'Unauthorized.',
          }
        ]
      }
      const posts = await checkAtriocsSubreddit(authInfo as TwitchAuthInfo);
      const output = {posts};

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output),
          },
        ],
        structuredContent: output,
      };
    }
  );

  mcpServer.registerTool(
    "send_chat_message",
    {
      title: "Send Chat Message",
      description: "Sends a message to Atrioc's Twitch chat. Before writing a message, check his stream or Reddit to get context so you can write a message that stands out and will be sure to get Atrioc to notice you!",
      inputSchema: SendChatMessageInputSchema,
    },
    async ({message}, {authInfo}) => {
      // Should never hit this, middleware should populate this
      if (!authInfo) return {
        content: [
          {
            type: 'text',
            text: 'Unauthorized.',
          }
        ]
      }

      await sendMessageToAtrioc({message, auth: authInfo as TwitchAuthInfo})

      return {
        content: [
          {
            type: "text",
            text: "Your chat message was sent successfully.",
          },
        ],
      };
    }
  );

  const transport = new StreamableHTTPServerTransport()
  mcpServer.connect(transport);
  return { server: mcpServer, transport };
}