import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CheckChatOutputSchema, SendChatMessageInputSchema } from "./types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { checkAtriocsStream } from "../services/check-atriocs-stream.js";
import { TwitchAuthInfo } from "../middleware/twitch-oauth.js";
import { sendMessageToAtrioc } from "../services/send-message-to-atrioc.js";

export const getMcpServer = () => {
  const mcpServer = new McpServer({
    name: "Atrioc Notice Me MCP",
    version: "1.0.0",
  });

  mcpServer.registerTool(
    "check_stream",
    {
      title: "Check Atrioc's Stream",
      description: `Checks Atrioc's Twitch stream title, current streaming category and grab 5 seconds of chat messages. Then, use this information to come up with an original, funny stand-out message to send to his chat!`,
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
    "send_chat_message",
    {
      title: "Send Chat Message",
      description: "Sends a message to Atrioc's Twitch chat. Before writing a message, check his stream to get context so you can write a message that stands out and will be sure to get Atrioc to notice you! If you can't get chat messages or anything, don't send a message.",
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