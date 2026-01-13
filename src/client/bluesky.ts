import {AtpAgent} from '@atproto/api';
import sharp from "sharp";
import {Attribution, WikimediaObject} from "../types/types";

interface BlueskyConfig {
  username: string,
  password: string
}

export class Bluesky {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyConfig) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }


  async post(image: WikimediaObject): Promise<void> {

    console.log("Logging in...")
    await this.agent.login({identifier: this.config.username, password: this.config.password})
    console.log(`Posting image: ${image.attribution.url}...`)
    const {uri, cid} = await this.postImage(image);
    console.log("Just posted! URI: ", uri, " CID: ", cid);
    console.log(`Posting attribution for ${image.attribution.url}...`)
    await this.postAttribution(image.attribution, cid, uri)
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

  private async postAttribution(attr: Attribution, cid: string, uri: string) {
    return await this.agent.post({
      text: `Author: ${attr.author.slice(0, 50)}
Date: ${attr.date.slice(0, 30)}
Licence: ${attr.licence.slice(0, 40)}
Source: ${attr.url}`,
      reply: {
        root: {
          cid: cid,
          uri: uri
        },
        parent: {
          cid: cid,
          uri: uri
        }
      }
    })
  }
}


async function downScale(original: Buffer, maxSizeBytes: number): Promise<Buffer> {

  let quality = 90
  let image = original
  let counter = 0
  console.log(`Original image size: ${image.byteLength} bytes`)
  while (image.byteLength > maxSizeBytes && quality > 10) {
    counter++
    quality -= 5
    image = await sharp(image)
      .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
      .jpeg({quality, mozjpeg: true})
      .toBuffer()
  }

  if (counter > 0) console.log(`Downscaled image ${counter} times`)

  return image
}
