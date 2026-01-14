import {PostImageClient} from "./socialMediaClients.js";
import {WikimediaObject} from "../types/types.js";
import * as Mastodon from 'tsl-mastodon-api';

export class MastodonImageClient implements PostImageClient {

  constructor(private readonly config: { accessToken: string }) {
  }

  async post(image: WikimediaObject): Promise<void> {

    console.log("Logging in...")

    const mastodon = new Mastodon.API({
      access_token: this.config.accessToken,
      api_url: "https://mastodon.social/api/v1/"
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

      await mastodon.postStatus({
        status: image.description,
        media_ids: [media.json.id],
      })
    } catch (e) {
      console.log(e)
    }
  }

}