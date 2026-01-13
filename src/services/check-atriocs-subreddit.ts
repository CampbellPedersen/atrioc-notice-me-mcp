import { RedditPost } from "../mcp/types.js";
import { TwitchAuthInfo } from "../middleware/twitch-oauth.js";
import { getTopComments, getTopPosts } from "./reddit.js";


export const checkAtriocsSubreddit = async (auth: TwitchAuthInfo): Promise<RedditPost[]> => {
  const subreddit = 'atrioc';
  const posts = await getTopPosts({subreddit});
  return await Promise.all(posts.map(async (post) => {
    const comments = await getTopComments({subreddit, postId: post.id});

    return {
      ...post,
      comments,
    }
  }));
}