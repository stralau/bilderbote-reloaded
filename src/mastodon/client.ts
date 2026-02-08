import {PostImageClient, RepostClient} from "../types/socialMediaClients.js";
import {Attribution, WikimediaObject} from "../types/types.js";
import * as Mastodon from 'tsl-mastodon-api';
import {randomElement} from "../util/util.js";
import {AttributionEntries} from "../util/attributionEntries.js";
import {retry} from "../util/Retry.js";
import {Result} from "../util/Result.js";
import * as JSON from "tsl-mastodon-api/lib/JSON/index.js";
import API from "tsl-mastodon-api/lib/API.js";
import {downScale} from "../util/image.js";
import sharp, {Metadata} from "sharp";

export class MastodonImageClient implements PostImageClient {

  private readonly mastodon: Mastodon.API;

  constructor(private readonly config: {
    instance_url: string,
    accessToken: string,
    userAgent: string
  }, private readonly attributionClient: MastodonAttributionClient) {
    this.mastodon = new Mastodon.API({
      api_url: `${this.config.instance_url}/api/v1/`,
      access_token: this.config.accessToken,
      user_agent: this.config.userAgent
    })

  }

  async post(image: WikimediaObject): Promise<void> {

    console.log("Posting image...")

    try {
      // Retry image upload
      const status = await retry({
        attempts: 3,
        fn: () => Result.tryAsync(async () => {
          // I couldn’t get an authoritative source, but some large images failed to post.
          // Perplexity states these limits: 16MB file size, 8,388,608 pixels.
          const scaled = await downScale(image.image, 16 * 1024 * 1024, this.scaleDimensions)
          const media = await this.mastodon.postMediaAttachment(
            {
              file: new File([scaled], "image.jpeg", {type: scaled.type}),
              description: image.description.slice(0, 1500),
            },
            true
          )

          console.log(media.json)

          return await this.mastodon.postStatus({
            status: image.description.slice(0, 500),
            media_ids: [media.json.id],
          })
        })
      })

      await retry({
        attempts: 3,
        fn: () => this.attributionClient.postAttribution(image.attribution, status.get().json.id),
      })
    } catch (e) {
      console.log(e)
    }
  }

  private async scaleDimensions(image: Buffer, md: Metadata): Promise<{image: Buffer, scaled: boolean}> {
    if (md.width * md.height <= 8_388_608) {
      return {image, scaled: false}
    }

    const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
    const width = Math.floor(md.width * ratio);

    console.log(`Image is too large: ${md.width}x${md.height}, ${image.byteLength} bytes. Resizing to width ${width}.`)

    image = await sharp(image)
      .resize({width: width, fit: 'inside', withoutEnlargement: true})
      .jpeg({quality: 90, mozjpeg: true})
      .toBuffer()

    md = await sharp(image).metadata()
    console.log(`Resized to ${md.width}x${md.height}, ${image.byteLength} bytes.`)

    return {image, scaled: true}
  }

}

export class MastodonAttributionClient {
  constructor(private readonly config: { accessToken: string }) {
  }

  async postAttribution(attr: Attribution, originalPostId: string): Promise<Result<API.Success<(JSON.Status | JSON.StatusSchedule)>>> {

    return Result.tryAsync(async () => {
      console.log("Logging in...")

      const mastodon = new Mastodon.API({
        access_token: this.config.accessToken,
        api_url: "https://mastodon.social/api/v1/"
      })

      console.log("Posting attribution...")

      const attribution = new AttributionEntries(attr, 500)

      return await mastodon.postStatus({
        status: attribution.attributionText(),
        in_reply_to_id: originalPostId
      })
    })
  }


}

export class MastodonRepostClient implements RepostClient {

  constructor(private readonly config: { accessToken: string, imageAccountID: string }) {
  }

  async repost(): Promise<string> {
    console.log("Logging in...")

    const mastodon = new Mastodon.API({
      access_token: this.config.accessToken,
      api_url: "https://mastodon.social/api/v1/"
    })

    console.log("Reposting...")
    const accountID = await mastodon
      .get("accounts/lookup", {acct: this.config.imageAccountID})
      .then(r => r.json.id as string)

    console.log("accountID", accountID)
    const posts = await mastodon.getStatuses(accountID, {limit: 6})
      .then(s => s.json)


    const post = randomElement(posts)

    if (post.reblogged) return `Post ${post.uri} already reposted`

    const response = await mastodon.post(`statuses/${post.id}/reblog`)
    return response.json.uri
  }
}
