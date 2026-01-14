import {WikimediaService} from "./service/wikimedia.js";
import * as process from 'process';
import {BlueskyAttribution, BlueskyImage} from "./client/bluesky.js";
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./client/wikimedia.js";
import {MastodonAttributionClient, MastodonImageClient} from "./client/mastodon.js";

export const handler = async () => {

  dotenv.config();

  const wikimediaClient = new WikimediaClient({});
  const wikimedia = new WikimediaService(wikimediaClient)
  const attributionClient = new BlueskyAttribution({
    username: process.env.BLUESKY_ATTRIBUTION_USERNAME,
    password: process.env.BLUESKY_ATTRIBUTION_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE
  })

  const bluesky = new BlueskyImage({
    username: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD
  }, attributionClient);

  const mastodonAttributionClient = new MastodonAttributionClient({
    accessToken: process.env.MASTODON_ATTRIBUTION_ACCESS_TOKEN
  })

  const mastodon = new MastodonImageClient({accessToken: process.env.MASTODON_ACCESS_TOKEN}, mastodonAttributionClient)

  console.log("fetching image")

  let image = await wikimedia.fetchImage()

  await Promise.all([
    bluesky.post(image),
    mastodon.post(image)]
  )

  return {
    statusCode: 200,
    body: JSON.stringify({message: image.description}),
  };
};
