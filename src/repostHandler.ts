import * as process from 'process';
import {BlueskyRepost} from "./bluesky/repostClient.js";
import * as dotenv from 'dotenv';
import {MastodonRepostClient} from "./mastodon/client.js";
import {version} from "./version.js";

export const repostHandler = async () => {

  dotenv.config();
  console.log(`Version: ${version}`);

  const bluesky = new BlueskyRepost({
    username: process.env.BLUESKY_REPOST_USERNAME,
    password: process.env.BLUESKY_REPOST_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE,
    repostClientHandle: process.env.BLUESKY_REPOST_HANDLE,
  });

  const mastodon = new MastodonRepostClient({
    accessToken: process.env.MASTODON_REPOST_ACCESS_TOKEN,
    imageAccountID: process.env.MASTODON_IMAGE_ACCOUNT,
  })

  const results = await Promise.allSettled([mastodon.repost(), bluesky.repost()])

  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason)
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to repost: " + errors.map(e => e.message).join(", "))
  }

  const message = results.map(r => (r as PromiseFulfilledResult<string>).value).join(', ')

  return {
    statusCode: 200,
    body: message,
  };
};
