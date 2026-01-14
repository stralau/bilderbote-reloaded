import {AtpAgent} from '@atproto/api';
import sharp from "sharp";
import {Attribution, WikimediaObject} from "../types/types.js";
import {randomElement} from "../util/util.js";
import {FeedViewPost} from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import {PostImageClient, RepostClient} from "./socialMediaClients.js";

interface BlueskyConfig {
  username: string,
  password: string
}

interface BlueskyRepostConfig {
  username: string,
  password: string,
  imageClientHandle: string,
  repostClientHandle: string
}

interface BlueskyAttributionConfig {
  username: string,
  password: string,
  imageClientHandle: string,
}

export class BlueskyImage implements PostImageClient{
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyConfig, private readonly attributionClient: BlueskyAttribution) {
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

export class BlueskyAttribution {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyAttributionConfig) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }

  async post(attr: Attribution, cid: string, uri: string): Promise<void> {

    const attributionHead = `Author: ${attr.author.slice(0, 50)}
Date: ${attr.date.slice(0, 30)}
Licence: ${attr.licence.slice(0, 40)}
Source: `;

    const attributionUrl = attr.url.slice(0, 300 - attributionHead.length);

    const attribution = `${attributionHead}${attributionUrl}`;

    console.log(attribution)

    const attributionLength = new TextEncoder().encode(attribution).byteLength
    const urlLength = new TextEncoder().encode(attributionUrl).byteLength


    await this.agent.login({identifier: this.config.username, password: this.config.password})
    await this.agent.post({
      text: attribution,
      facets: [
        {
          index: {
            byteStart: attributionLength - urlLength,
            byteEnd: attributionLength
          },
          features: [{
            $type: 'app.bsky.richtext.facet#link',
            uri: attr.url
          }]
        }
      ],
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

export class BlueskyRepost implements RepostClient  {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyRepostConfig) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }

  async repost(): Promise<string> {

    console.log(`Fetching timeline`)

    await this.agent.login({identifier: this.config.username, password: this.config.password})

    const timeline = await this.agent.getAuthorFeed({
      actor: await this.resolveDID(this.config.imageClientHandle),
      limit: 6,
      filter: "posts_no_replies"
    })

    const post: FeedViewPost = randomElement(timeline.data.feed)

    if (await this.repostedByMe(post.post.uri)) {
      return `Post ${post.post.uri} already reposted by ${this.config.username}`
    }
    console.log(`Reposting ${post.post.uri}`)
    const {uri, cid} = await this.agent.repost(post.post.uri, post.post.cid)
    console.log(`Reposted ${uri}`)
    return uri

  }

  private async repostedByMe(uri: string): Promise<boolean> {
    const repostedBy = await this.agent.getRepostedBy({uri}).then(r => r.data.repostedBy)
    console.log(
      `Post ${uri} reposted by ${repostedBy.map(r => r.did).join(", ")}`
    );
    const did = await this.resolveDID(this.config.repostClientHandle);
    return repostedBy.some(r => r.did == did)
  }


  resolveDID = async (handle: string) =>
    await this.agent.resolveHandle({handle: handle}).then(r => r.data.did)

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
