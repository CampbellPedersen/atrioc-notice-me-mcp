import { TwitchAuthInfo } from "../middleware/twitch-oauth.js";
import { getChatClient, sendMessage } from "./twitch.js";

type SendMessageToAtriocParams = {
  auth: TwitchAuthInfo;
  message: string;
}

export const sendMessageToAtrioc = async ({message, auth}: SendMessageToAtriocParams) => {
  const to = 'atrioc';
  const chatClient = getChatClient(auth, [to]);
  chatClient.connect();
  await sendMessage({message, to, client: chatClient});
  chatClient.quit();
}