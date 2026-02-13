import {handler} from "../../src/handler.js";
import * as dotenv from "dotenv";
import * as Mastodon from "tsl-mastodon-api";

dotenv.config();

const mastodon = new Mastodon.API({
  access_token: process.env.MASTODON_ACCESS_TOKEN,
  api_url: `${process.env.MASTODON_INSTANCE_URL}/api/v1/`
})

async function getLatestPost() {
  const account = await mastodon.get("accounts/verify_credentials")
    .then(r => r.json as any)

  const posts = await mastodon.getStatuses(account.id, {limit: 1}).then(s => s.json)
  return posts[0]
}

test('posts an image successfully', async () => {
  const postBefore = await getLatestPost()

  const result = await handler({})

  expect(result.statusCode).toBe(200)

  const postAfter = await getLatestPost()
  expect(postAfter.id).not.toBe(postBefore.id)
}, 30_000)