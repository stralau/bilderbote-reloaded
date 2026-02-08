import {WikimediaService} from "./wikimedia/service.js";
import * as process from 'process';
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./wikimedia/client.js";
import {MastodonAttributionClient, MastodonImageClient} from "./mastodon/client.js";
import {HttpClient} from "./net/httpClient.js";
import {AttributionClient} from "./bluesky/attributionClient.js";
import {BlueskyImage} from "./bluesky/imageClient.js";

export const handler = async (location?: string | undefined) => {

  dotenv.config();

  const httpClient = new HttpClient({userAgent: process.env.USER_AGENT});
  const wikimediaClient = new WikimediaClient(httpClient);
  const wikimedia = new WikimediaService(wikimediaClient)
  const attributionClient = new AttributionClient({
    username: process.env.BLUESKY_ATTRIBUTION_USERNAME,
    password: process.env.BLUESKY_ATTRIBUTION_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE
  })

  const bluesky = new BlueskyImage({
    username: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
    userAgent: process.env.USER_AGENT,
  }, attributionClient);

  const mastodonAttributionClient = new MastodonAttributionClient({
    accessToken: process.env.MASTODON_ATTRIBUTION_ACCESS_TOKEN
  })

  const mastodon = new MastodonImageClient({
    instance_url: process.env.MASTODON_INSTANCE_URL,
    accessToken: process.env.MASTODON_ACCESS_TOKEN,
    userAgent: process.env.USER_AGENT
  }, mastodonAttributionClient)

  console.log("fetching image")

  let image = await wikimedia.fetchWikimediaObject(location)

  console.log("image fetched", JSON.stringify(image, null, 2))

  await Promise.all([
    bluesky.post(image),
    mastodon.post(image)]
  )

  return {
    statusCode: 200,
    body: JSON.stringify({message: image.description}),
  };
};
