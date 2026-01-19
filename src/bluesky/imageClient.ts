import {PostImageClient} from "../types/socialMediaClients.js";
import {AtpAgent} from "@atproto/api";
import {WikimediaObject} from "../types/types.js";
import {BlueskyAttribution} from "./attributionClient.js";
import sharp from "sharp";

interface BlueskyConfig {
  username: string,
  password: string
  userAgent: string
}

export class BlueskyImage implements PostImageClient {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyConfig, private readonly attributionClient: BlueskyAttribution) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
      headers: [['User-Agent', config.userAgent]]
    })
  }


  async post(image: WikimediaObject): Promise<void> {

    console.log("Logging in...")
    await this.agent.login({identifier: this.config.username, password: this.config.password})
    console.log(`Posting image: ${image.attribution.url}...`)
    const {uri, cid} = await this.postImage(image);
    console.log("Just posted! URI: ", uri, " CID: ", cid);
    console.log(`Posting attribution for ${image.attribution.url}...`)
    await this.attributionClient.post(image.attribution, cid, uri)
    console.log("Done!")
  }

  private async postImage(image: WikimediaObject): Promise<{ uri: string, cid: string }> {
    const blob = await downScale(Buffer.from(await image.image.arrayBuffer()), 976_560)

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

}

async function downScale(original: Buffer, maxSizeBytes: number): Promise<Buffer> {

  let image = original
  let md = await sharp(image).metadata()

  let counter = 0
  if (md.width > 1000 && md.height > 1000) {
    console.log(`Image is too large: ${md.width}x${md.height}, ${image.byteLength} bytes. Resizing dimensions.`)
    counter++
    image = await sharp(image)
      .resize(1000, 1000, {fit: 'contain', withoutEnlargement: true})
      .jpeg({quality: 90, mozjpeg: true})
      .toBuffer()

    console.log(`Resized to ${md.width}x${md.height}, ${image.byteLength} bytes.`)
  }

  async function shrink(image: Buffer, quality: number, counter: number): Promise<{ image: Buffer, counter: number }> {
    if (image.byteLength <= maxSizeBytes) return {image: image, counter: counter}

    console.log(`Image is too large: ${image.byteLength} bytes`)

    return shrink(await sharp(image).jpeg({quality: quality, mozjpeg: true}).toBuffer(), quality - 5, counter + 1)
  }

  const result = await shrink(image, 90, counter)

  if (result.counter > 0) console.log(`Downscaled image ${result.counter} times`)

  return result.image
}
