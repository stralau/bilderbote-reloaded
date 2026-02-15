import {PostImageClient} from "../types/socialMediaClients.js";
import {AtpAgent} from "@atproto/api";
import {Metadata} from "../types/types.js";
import {AttributionClient} from "./attributionClient.js";
import {retry} from "../util/Retry.js";
import {Result} from "../util/Result.js";

interface BlueskyConfig {
  username: string,
  password: string
  userAgent: string
}

export class BlueskyImage implements PostImageClient {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyConfig, private readonly attributionClient: AttributionClient) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
      headers: [['User-Agent', config.userAgent]]
    })
  }


  async post(image: Blob, metadata: Metadata): Promise<void> {
    const result = await retry({
      attempts: 3,
      fn: async () => {
        console.log("Logging in...")
        await this.agent.login({identifier: this.config.username, password: this.config.password})
        console.log(`Posting image: ${metadata.attribution.url}...`)
        const {uri, cid} = await this.postImage(image, metadata);
        console.log("Just posted! URI: ", uri, " CID: ", cid);
        return {uri, cid}
      }
    })

    const {uri, cid} = result.get()

    await retry({
      attempts: 3,
      fn: async () => {
        console.log(`Posting attribution for ${metadata.attribution.url}...`)
        await this.attributionClient.post(metadata.attribution, cid, uri)
        console.log("Done!")
      }
    })
  }

  private async postImage(image: Blob, metadata: Metadata): Promise<{ uri: string, cid: string }> {

    const blobRef = await this.agent.uploadBlob(image)
      .then(r => r.data.blob)

    return await this.agent.post({
      text: metadata.description.slice(0, 300),
      embed: {
        $type: 'app.bsky.embed.images',
        images: [{
          image: blobRef,
          alt: metadata.description
        }]
      }
    });
  }

}
