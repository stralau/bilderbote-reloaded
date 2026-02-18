import {WikimediaService} from "./wikimedia/service.js";
import * as process from 'process';
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./wikimedia/client.js";
import {MastodonAttributionClient, MastodonImageClient} from "./mastodon/client.js";
import {HttpClient} from "./net/httpClient.js";
import {AttributionClient} from "./bluesky/attributionClient.js";
import {BlueskyImage} from "./bluesky/imageClient.js";
import {version} from "./version.js";
import {retry} from "./util/Retry.js";
import {HttpStatusError} from "./types/types.js";
import {blueskyImageScaler, mastodonImageScaler} from "./util/image.js";
import {Log} from "./util/log.js";

export const handler = async (event: { location?: string | undefined }) => {

  dotenv.config();
  console.log(`Version: ${version}`);

  const httpClient = new HttpClient({userAgent: process.env.USER_AGENT});
  const wikimediaClient = new WikimediaClient(httpClient);
  const wikimedia = new WikimediaService(wikimediaClient)

  const attributionClient = new AttributionClient({
    username: process.env.BLUESKY_ATTRIBUTION_USERNAME,
    password: process.env.BLUESKY_ATTRIBUTION_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE
  })

  const blueskyLog = new Log("Bluesky")
  const mastodonLog = new Log("Mastodon")

  const blueskyClient = new BlueskyImage({
    username: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
    userAgent: process.env.USER_AGENT,
  }, attributionClient, blueskyLog);

  const mastodonAttributionClient = new MastodonAttributionClient({
    accessToken: process.env.MASTODON_ATTRIBUTION_ACCESS_TOKEN
  }, mastodonLog)

  const mastodonClient = new MastodonImageClient({
    instance_url: process.env.MASTODON_INSTANCE_URL,
    accessToken: process.env.MASTODON_ACCESS_TOKEN,
    userAgent: process.env.USER_AGENT
  }, mastodonAttributionClient, mastodonLog)

  console.log("fetching image")

  const {metadata, mastodon, bluesky} = (await retry({
    attempts: 10,
    fn: async () => {
      const object = await wikimedia.fetchWikimediaObject(event.location)

      console.log("image fetched", JSON.stringify(object.metadata, null, 2))

      const [mastodonImage, blueskyImage] = await Promise.all([
        mastodonImageScaler.scale(object.image),
        blueskyImageScaler.scale(object.image)
      ])

      return {metadata: object.metadata, mastodon: mastodonImage, bluesky: blueskyImage}
    },
    isFatal: (e: any) => e instanceof HttpStatusError && e.status == 429,
  })).get()

  const results = await Promise.allSettled([
    blueskyClient.post(bluesky, metadata),
    mastodonClient.post(mastodon, metadata),
  ])

  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason)
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to post to: " + errors.map(e => e.message).join(", "))
  }

  return {
    statusCode: 200,
    body: JSON.stringify({message: metadata.description}),
  };
};
