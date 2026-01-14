import * as process from 'process';
import {BlueskyRepost} from "./client/bluesky.js";
import * as dotenv from 'dotenv';
import {MastodonRepostClient} from "./client/mastodon";

export const repostHandler = async () => {

  dotenv.config();

  const bluesky = new BlueskyRepost({
    username: process.env.BLUESKY_REPOST_USERNAME,
    password: process.env.BLUESKY_REPOST_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE,
    repostClientHandle: process.env.BLUESKY_REPOST_HANDLE,
  });

  const mastodon = new MastodonRepostClient({
    accessToken: process.env.MASTODON_REPOST_ACCESS_TOKEN,
    imageAccountID: process.env.MASTODON_IMAGE_ACCOUNT_ID,
  })

  const message = await Promise.all([mastodon.repost(), bluesky.repost()])
    .catch(e => [`Failed to repost: ${JSON.stringify(e, null, 2)}`])
    .then(messages => messages.join(', '))

  return {
    statusCode: 200,
    body: message,
  };
};
