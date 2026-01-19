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

  let quality = 90
  let image = original
  let counter = 0

  let md = await sharp(image).metadata()

  console.log(`Original image size: ${image.byteLength} bytes, ${md.width}x${md.height} pixels.`)
  while (quality > 10 && (image.byteLength > maxSizeBytes || md.width  > 1000 || md.height > 1000)) {
    console.log('quality', quality, 'image size', image.byteLength, 'width', md.width, 'height', md.height, 'max size', maxSizeBytes, 'counter', counter, '... downscaling image')
    counter++
    quality -= 5
    image = await sharp(image)
      .resize(1000, 1000, {fit: 'contain', withoutEnlargement: true})
      .jpeg({quality, mozjpeg: true})
      .toBuffer()
    md = await sharp(image).metadata()
  }

  if (counter > 0) console.log(`Downscaled image ${counter} times`)

  return image
}
