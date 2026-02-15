import {PostImageClient, RepostClient} from "../types/socialMediaClients.js";
import {Attribution, Metadata} from "../types/types.js";
import * as Mastodon from 'tsl-mastodon-api';
import {randomElement} from "../util/util.js";
import {AttributionEntries} from "../util/attributionEntries.js";
import {retry} from "../util/Retry.js";
import {Result} from "../util/Result.js";
import * as JSON from "tsl-mastodon-api/lib/JSON/index.js";
import API from "tsl-mastodon-api/lib/API.js";

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

  async post(image: Blob, metadata: Metadata): Promise<void> {

    console.log("Posting image...")

    // Retry image upload
    const status = await retry({
      attempts: 3,
      fn: () => Result.tryAsync(async () => {
        const media = await this.mastodon.postMediaAttachment(
          {
            file: new File([image], "image.jpeg", {type: image.type}),
            description: metadata.description.slice(0, 1500),
          },
          true
        )

        console.log(media.json)

        return await this.mastodon.postStatus({
          status: metadata.description.slice(0, 500),
          media_ids: [media.json.id],
        })
      })
    })

    await retry({
      attempts: 3,
      fn: () => this.attributionClient.postAttribution(metadata.attribution, status.get().json.id),
    })
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
    if (posts.length === 0) throw new Error("No Mastodon posts found to repost")

    const post = randomElement(posts)

    if (post.reblogged) return `Post ${post.uri} already reposted`

    const response = await mastodon.post(`statuses/${post.id}/reblog`)
    return response.json.uri
  }
}
