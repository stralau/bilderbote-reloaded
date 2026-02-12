import {WikimediaService} from "./wikimedia/service.js";
import * as process from 'process';
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./wikimedia/client.js";
import {MastodonAttributionClient, MastodonImageClient} from "./mastodon/client.js";
import {HttpClient} from "./net/httpClient.js";
import {AttributionClient} from "./bluesky/attributionClient.js";
import {BlueskyImage} from "./bluesky/imageClient.js";

export const handler = async (event: {location?: string | undefined}) => {

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

  let image = await wikimedia.fetchWikimediaObject(event.location)

  console.log("image fetched", JSON.stringify(image, null, 2))

  const results = await Promise.allSettled([
    bluesky.post(image),
    mastodon.post(image)
  ])

  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason)
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to post to: " + errors.map(e => e.message).join(", "))
  }

  return {
    statusCode: 200,
    body: JSON.stringify({message: image.description}),
  };
};
