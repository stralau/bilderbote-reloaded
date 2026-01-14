import {WikimediaService} from "./service/wikimedia";
import * as process from 'process';
import {BlueskyAttribution, BlueskyImage} from "./client/bluesky";
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./client/wikimedia";

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

  console.log("fetching image")

  let image = await wikimedia.fetchImage()

  await bluesky.post(image)

  return {
    statusCode: 200,
    body: JSON.stringify({ message: image.description }),
  };
};
