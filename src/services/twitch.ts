import { ApiClient } from '@twurple/api';
import { StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { ChatMessage } from "../mcp/types.js";
import { TwitchAuthInfo } from "../middleware/twitch-oauth.js";
import { sleep } from "../util/sleep.js";

export const SCOPES = ['chat:read', 'chat:edit'];

type GetUserParams = {
  login: string;
  client: ApiClient;
}

type User = {
  id: string;
}

export const getUser = async ({client, login}: GetUserParams): Promise<User> => {
  const user = await client.users.getUserByName(login);

  if (!user) throw new Error('User not found.')

  return {
    id: user.id
  };
}

type GetChannelParams = {
  user: User;
  client: ApiClient;
}

type Channel = {
  title: string;
  category: string;
}

export const getChannel = async ({user, client}: GetChannelParams): Promise<Channel> => {
  const stream = await client.channels.getChannelInfoById(user.id);
  if (!stream) throw new Error('Stream not found.');

  return {
    title: stream.title,
    category: stream.gameName,
  }
}

type GetChatMessageBatchParams = {
  channel: string;
  client: ChatClient;
}

export const getChatMessageBatch = async ({channel, client}: GetChatMessageBatchParams): Promise<ChatMessage[]> => {
  const messages: ChatMessage[] = [];
  const chatListener = client.onMessage((_, user, text) => {
    messages.push({username: user, content: text})
  });
  await sleep(5000);
  chatListener.unbind();
  return messages;
}

type SendMessageParams = {
  message: string;
  to: string;
  client: ChatClient;
}

export const sendMessage = async ({message, to, client}: SendMessageParams): Promise<void> => {
  await client.say(to, message);
}

export const getApiClient = (auth: TwitchAuthInfo) => {
  const authProvider = getAuthProvider(auth);
  const client = new ApiClient({authProvider});
  return client;
}

export const getChatClient = (auth: TwitchAuthInfo, channels: string[]) => {
  const authProvider = getAuthProvider(auth);
  const client = new ChatClient({authProvider, channels});
  return client;
}

const getAuthProvider = (auth: TwitchAuthInfo) => {
  const clientId = process.env.TWITCH_CLIENT_ID ?? '';
  const authProvider = new StaticAuthProvider(clientId, auth.token);
  return authProvider;
}

type Validation = {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
}

export const validateAccessToken = async (accessToken: string): Promise<Validation> => {
  const response = await fetch(
    `${process.env.TWITCH_OAUTH_SERVER}/oauth2/validate`,
    {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Unauthorized');
  }

  return (await response.json()) as Validation;
}

type AccessToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: 'bearer';
}

export const exchangeAuthorizationCodeForToken = async (payload: URLSearchParams): Promise<AccessToken> => {
  const TWITCH_OAUTH_SERVER = process.env.TWITCH_OAUTH_SERVER;

  const response = await fetch(`${TWITCH_OAUTH_SERVER}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });

  const token = await response.json() as Omit<AccessToken, 'scope'> & {scope: string | string[]};

  return {
    ...token,
    // Twitch can return this as an array, so we need to convert to a space-delimited string
    scope: Array.isArray(token.scope) ? token.scope.join(' ') : token.scope,
  };
}