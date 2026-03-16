require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const { Octokit } = require("@octokit/rest");
const wordwrap = require("wordwrap");
const { formatDistanceStrict } = require("date-fns");

const {
  GIST_ID: gistId,
  TWITTER_USER: twitterHandle,
  TWITTER_BEARER_TOKEN: bearerToken,
  TWITTER_CONSUMER_KEY: consumerKey,
  TWITTER_CONSUMER_SECRET: consumerSecret,
  TWITTER_ACCESS_TOKEN_KEY: accessTokenKey,
  TWITTER_ACCESS_TOKEN_SECRET: accessTokenSecret,
  GH_TOKEN: githubToken
} = process.env;

// Support both Bearer Token (app-only) and OAuth 1.0a authentication
if (!bearerToken) {
  const missingOAuthVars = [];
  if (!consumerKey) missingOAuthVars.push("TWITTER_CONSUMER_KEY");
  if (!consumerSecret) missingOAuthVars.push("TWITTER_CONSUMER_SECRET");
  if (!accessTokenKey) missingOAuthVars.push("TWITTER_ACCESS_TOKEN_KEY");
  if (!accessTokenSecret) missingOAuthVars.push("TWITTER_ACCESS_TOKEN_SECRET");

  if (missingOAuthVars.length > 0) {
    throw new Error(
      `Twitter authentication is not configured correctly. Either set TWITTER_BEARER_TOKEN, or provide all OAuth 1.0a credentials. Missing environment variables: ${missingOAuthVars.join(
        ", "
      )}`
    );
  }
}

const twitterClient = bearerToken
  ? new TwitterApi(bearerToken)
  : new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessTokenKey,
      accessSecret: accessTokenSecret
    });

const authMode = bearerToken ? "BearerToken" : "OAuth1.0a";
const twitter = twitterClient.readOnly;

const octokit = new Octokit({
  auth: githubToken
});

async function main() {
  try {
    // Resolve the numeric user ID from the screen name
    const userResponse = await twitter.v2.userByUsername(twitterHandle);
    if (!userResponse.data) {
      console.error(`User not found: ${twitterHandle}`);
      return;
    }
    const userId = userResponse.data.id;

    // Fetch the latest tweet (exclude replies and retweets).
    // max_results minimum for this endpoint is 5; we take only the first result.
    const timeline = await twitter.v2.userTimeline(userId, {
      max_results: 5,
      exclude: ["replies", "retweets"],
      "tweet.fields": ["created_at", "public_metrics"]
    });

    const tweet = timeline.tweets[0];
    if (!tweet) {
      console.error(`No tweets found for user: ${twitterHandle}`);
      return;
    }

    await updateGist(tweet);
  } catch (error) {
    const status = error && (error.status || error.code || error.statusCode);
    console.error(
      `Error while calling Twitter API for user "${twitterHandle}" using auth mode "${authMode}".` +
        (status ? ` Status: ${status}.` : "") +
        (error && error.message ? ` Message: ${error.message}` : "")
    );
    process.exit(1);
  }
}

async function updateGist(tweet) {
  const wrap = wordwrap(62);

  let gist;
  try {
    gist = await octokit.gists.get({ gist_id: gistId });
  } catch (error) {
    console.error(`Unable to get gist\n${error}`);
    return;
  }
  // Get original filename to update that same file
  const filename = Object.keys(gist.data.files)[0];
  const parsedDate = new Date(tweet.created_at);
  const timeAgo = formatDistanceStrict(parsedDate, new Date());

  const likes = tweet.public_metrics.like_count;
  const retweets = tweet.public_metrics.retweet_count;

  try {
    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [filename]: {
          filename: `@${twitterHandle} - ${timeAgo} ago | ❤ ${likes} | 🔁 ${retweets}`,
          content: wrap(tweet.text)
        }
      }
    });
  } catch (error) {
    console.error(`Unable to update gist\n${error}`);
  }
}

(async () => {
  await main();
})();
