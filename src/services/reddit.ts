import { RedditComment, RedditPost } from "../mcp/types.js"

const USER_AGENT = "notice-me-atrioc-mcp/0.1";

type GetTopPostsParams = {
  subreddit: string;
}

type RedditPostWithoutComments = Omit<RedditPost, 'comments'>

export const getTopPosts = async ({subreddit}: GetTopPostsParams): Promise<RedditPostWithoutComments[]> => {
  const limit = '13';
  const urlParams = new URLSearchParams({limit});
  const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?${urlParams.toString()}`, {method: 'GET'});
  return (await response.json()).data.children.filter(isValidRawPost).map(rawPostToPost);
}

const isValidRawPost = (raw: any) => !raw.data.stickied;

const rawPostToPost = (raw: any): RedditPostWithoutComments => {
  const data = raw.data;
  return {
    id: data.id,
    author: data.author,
    title: data.title,
    textContent: data.selftext,
    upvotes: data.score,
    permalink: `https://reddit.com${data.permalink}`,
  }
}


type GetTopCommentsParams = {
  subreddit: string;
  postId: string;
}

export const getTopComments = async ({subreddit, postId}: GetTopCommentsParams): Promise<RedditComment[]> => {
  const limit = 5;
  const maxDepth = 4;
  const sort = 'top';
  const response = await fetch(
    `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&depth=${maxDepth}&sort=${sort}`,
    {method: 'GET', headers: {"User-Agent": USER_AGENT}
  });
  
  const [_, commentsListing] = await response.json();
  const comments = commentsListing.data.children ?? [];
  return comments.filter(isValidRawComment).map(rawCommentToComment)
}


const rawCommentToComment = (raw: any): RedditComment => {
  const data = raw.data;
  const replies = data.replies && typeof data.replies === 'object' ? data.replies.data.children ?? [] : [];
  return {
    author: data.author,
    upvotes: data.score,
    body: cleanBody(data.body),
    replies: replies.filter(isValidRawComment).map(rawCommentToComment),
  }
};

const isValidRawComment = (raw: any): boolean => !!raw.data.author

const cleanBody = (body: string): string => {
  if (!body) return "";
  return body.trim();
};