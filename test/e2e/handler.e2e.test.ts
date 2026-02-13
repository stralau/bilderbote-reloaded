import {handler} from "../../src/handler.js";
import * as dotenv from "dotenv";
import * as Mastodon from "tsl-mastodon-api";
import {AtpAgent} from "@atproto/api";
import {sanitiseText} from "../../src/util/text.js";

dotenv.config();

const mastodon = new Mastodon.API({
  access_token: process.env.MASTODON_ACCESS_TOKEN,
  api_url: `${process.env.MASTODON_INSTANCE_URL}/api/v1/`
})

const bluesky = new AtpAgent({service: 'https://bsky.social'})

async function getLatestMastodonPost() {
  const account = await mastodon.get("accounts/verify_credentials")
    .then(r => r.json as any)

  const posts = await mastodon.getStatuses(account.id, {limit: 1}).then(s => s.json)
  return posts[0]
}

async function getLatestBlueskyPost() {
  await bluesky.login({identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD})

  const feed = await bluesky.getAuthorFeed({
    actor: process.env.BLUESKY_IMAGE_HANDLE,
    limit: 1,
    filter: "posts_no_replies"
  })
  return feed.data.feed[0]
}

test('posts an image successfully', async () => {
  const mastodonBefore = await getLatestMastodonPost()
  const blueskyBefore = await getLatestBlueskyPost()

  const result = await handler({})

  expect(result.statusCode).toBe(200)

  const mastodonAfter = await getLatestMastodonPost()
  expect(mastodonAfter.id).not.toBe(mastodonBefore.id)

  const blueskyAfter = await getLatestBlueskyPost()
  expect(blueskyAfter.post.cid).not.toBe(blueskyBefore.post.cid)

  const mastodonText = sanitiseText(mastodonAfter.content)
  const blueskyText = (blueskyAfter.post.record as any).text
  expect(mastodonText.slice(0, 300)).toBe(blueskyText)
}, 30_000)