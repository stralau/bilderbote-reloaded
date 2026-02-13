import {AppBskyFeedDefs, AtpAgent} from '@atproto/api';
import {randomElement} from "../util/util.js";
import {RepostClient} from "../types/socialMediaClients.js";

interface BlueskyRepostConfig {
  username: string,
  password: string,
  imageClientHandle: string,
  repostClientHandle: string
}

export class BlueskyRepost implements RepostClient {
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
    if (timeline.data.feed.length === 0) throw new Error("No Bluesky posts found to repost")

    const post: AppBskyFeedDefs.FeedViewPost = randomElement(timeline.data.feed)

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
