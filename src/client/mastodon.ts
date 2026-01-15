import {PostImageClient, RepostClient} from "./socialMediaClients.js";
import {Attribution, WikimediaObject} from "../types/types.js";
import * as Mastodon from 'tsl-mastodon-api';
import {randomElement} from "../util/util.js";

export class MastodonImageClient implements PostImageClient {

  constructor(private readonly config: { instance_url: string, accessToken: string, userAgent: string }, private readonly attributionClient: MastodonAttributionClient) {
  }

  async post(image: WikimediaObject): Promise<void> {

    const mastodon = new Mastodon.API({
      api_url: `${this.config.instance_url}/api/v1/`,
      access_token: this.config.accessToken,
      user_agent: this.config.userAgent
    })

    console.log("Posting image...")

    try {
      const media = await mastodon.postMediaAttachment(
        {
          file: new File([image.image], "image.jpeg", {type: "image/jpeg"}),
          description: image.description,
        },
        true
      )

      console.log(media.json)

      const status = await mastodon.postStatus({
        status: image.description,
        media_ids: [media.json.id],
      })

      await this.attributionClient.postAttribution(image.attribution, status.json.id)
    } catch (e) {
      console.log(e)
    }
  }

}

export class MastodonAttributionClient {
  constructor(private readonly config: { accessToken: string }) {
  }

  async postAttribution(attr: Attribution, originalPostId: string): Promise<void> {
    console.log("Logging in...")

    const mastodon = new Mastodon.API({
      access_token: this.config.accessToken,
      api_url: "https://mastodon.social/api/v1/"
    })

    console.log("Posting attribution...")

    await mastodon.postStatus({
      status: `Author: ${attr.author.slice(0, 50)}
Date: ${attr.date.slice(0, 30)}
Licence: ${attr.licence.slice(0, 40)}
Source: ${attr.url}`,
      in_reply_to_id: originalPostId
    })
  }

}

export class MastodonRepostClient implements RepostClient{

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
