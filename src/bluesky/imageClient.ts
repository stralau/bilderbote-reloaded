import {PostImageClient} from "../types/socialMediaClients.js";
import {AtpAgent} from "@atproto/api";
import {WikimediaObject} from "../types/types.js";
import {AttributionClient} from "./attributionClient.js";
import sharp, {Metadata} from "sharp";
import {retry} from "../util/Retry.js";
import {Result} from "../util/Result.js";
import {downScale} from "../util/image.js";

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


  async post(image: WikimediaObject): Promise<void> {
    const result = await retry({
      attempts: 3,
      fn: () => Result.tryAsync(async () => {
        console.log("Logging in...")
        await this.agent.login({identifier: this.config.username, password: this.config.password})
        console.log(`Posting image: ${image.attribution.url}...`)
        const {uri, cid} = await this.postImage(image);
        console.log("Just posted! URI: ", uri, " CID: ", cid);
        return {uri, cid}
      })
    })

    const {uri, cid} = result.get()

    await retry({
      attempts: 3,
      fn: () => Result.tryAsync(async () => {
        console.log(`Posting attribution for ${image.attribution.url}...`)
        await this.attributionClient.post(image.attribution, cid, uri)
        console.log("Done!")
      })
    })
  }

  private async postImage(image: WikimediaObject): Promise<{ uri: string, cid: string }> {
    const blob = await downScale(image.image, 976_560, this.scaleDimensions)

    const blobRef = await this.agent.uploadBlob(blob)
      .then(r => r.data.blob)

    return await this.agent.post({
      text: image.description.slice(0, 300),
      embed: {
        $type: 'app.bsky.embed.images',
        images: [{
          image: blobRef,
          alt: image.description
        }]
      }
    });
  }

  private async scaleDimensions(image: Buffer, md: Metadata): Promise<{image: Buffer, scaled: boolean}> {
    if (md.width <= 1000 && md.height <= 1000) {
      return {image, scaled: false}
    }
    console.log(`Image is too large: ${md.width}x${md.height}, ${image.byteLength} bytes. Resizing dimensions.`)
    image = await sharp(image)
      .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
      .jpeg({quality: 90, mozjpeg: true})
      .toBuffer()

    md = await sharp(image).metadata()
    console.log(`Resized to ${md.width}x${md.height}, ${image.byteLength} bytes.`)

    return {image, scaled: true}
  }

}
