import * as process from 'process';
import {BlueskyRepost} from "./client/bluesky.js";
import * as dotenv from 'dotenv';

export const repostHandler = async () => {

  dotenv.config();

  const bluesky = new BlueskyRepost({
    username: process.env.BLUESKY_REPOST_USERNAME,
    password: process.env.BLUESKY_REPOST_PASSWORD,
    imageClientHandle: process.env.BLUESKY_IMAGE_HANDLE,
    repostClientHandle: process.env.BLUESKY_REPOST_HANDLE
  });

  console.log("fetching image")

  const message = await bluesky.repost()

  return {
    statusCode: 200,
    body: message,
  };
};
