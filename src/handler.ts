import {WikimediaService} from "./service/wikimedia";
import * as process from 'process';
import {BlueskyImage} from "./client/bluesky";
import * as dotenv from 'dotenv';
import {WikimediaClient} from "./client/wikimedia";
import {decryptEnvVar} from "./util/DecryptEnv";

export const handler = async () => {

  dotenv.config();

  if (!!process.env.LAMBDA_TASK_ROOT){
    await decryptEnvVar("BLUESKY_PASSWORD")
  }

  const wikimediaClient = new WikimediaClient({});
  const wikimedia = new WikimediaService(wikimediaClient)
  const bluesky = new BlueskyImage({username: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD});

  console.log("fetching image")

  let image = await wikimedia.fetchImage()

  await bluesky.post(image)

  return {
    statusCode: 200,
    body: JSON.stringify({ message: image.description }),
  };
};
