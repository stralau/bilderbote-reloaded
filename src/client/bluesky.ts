import {AtpAgent} from '@atproto/api';
import sharp from "sharp";
import {Attribution, WikimediaObject} from "../types/types";
import {rand} from "../util/util";
import {FeedViewPost} from "@atproto/api/dist/client/types/app/bsky/feed/defs";

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

export class BlueskyRepost {
  private readonly agent: AtpAgent;
  private imageClientDID: string
  private repostClientDID: string

  constructor(private readonly config: BlueskyRepostConfig) {
    console.log(config)
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }

  async repost(): Promise<string> {
    await this.resolveDID()

    console.log(`Image client: ${this.imageClientDID}`)

    console.log(`Fetching timeline`)

    const timeline = await this.agent.getAuthorFeed({actor: this.imageClientDID, limit: 6, filter: "posts_no_replies"})

    console.log(JSON.stringify(timeline, null, 2))

    const post: FeedViewPost = timeline.data.feed[rand(0, timeline.data.feed.length - 1)]

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
    return repostedBy.some(r => r.did == this.repostClientDID)
  }

  private async resolveDID(): Promise<void> {
    if (!this.imageClientDID) {
      console.log("Logging in...")
      await this.agent.login({identifier: this.config.username, password: this.config.password})
      this.imageClientDID = await this.agent.resolveHandle({handle: this.config.imageClientHandle})
        .then(r => r.data.did)
    }
    if (!this.repostClientDID) {
      this.repostClientDID = await this.agent.resolveHandle({handle: this.config.repostClientHandle})
        .then(r => r.data.did)
    }
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

    const attribution = `Author: ${attr.author.slice(0, 50)}
Date: ${attr.date.slice(0, 30)}
Licence: ${attr.licence.slice(0, 40)}
Source: ${attr.url}`;

    await this.agent.login({identifier: this.config.username, password: this.config.password})
    this.agent.post({
      text: attribution,
      facets: [
        {
          index: {
            byteStart: attribution.length - attr.url.length,
            byteEnd: attribution.length
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


export class BlueskyImage {
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
