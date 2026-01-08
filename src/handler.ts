import {fetchWikimediaImage} from "./service/wikimedia";
import * as process from 'process';
import {Bluesky} from "./client/bluesky";
import * as dotenv from 'dotenv';

export const handler = async () => {

  dotenv.config();

  const bluesky = new Bluesky({username: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD});

  console.log("fetching image")

  let image = await fetchWikimediaImage()

  await bluesky.post(image)

  return {
    statusCode: 200,
    body: JSON.stringify({ message: image.description }),
  };
};
