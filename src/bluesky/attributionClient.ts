import {AtpAgent} from "@atproto/api";
import {Attribution} from "../types/types.js";
import {AttributionEntries} from "./attribution.js";

interface BlueskyAttributionConfig {
  username: string,
  password: string,
  imageClientHandle: string,
}

export class BlueskyAttribution {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyAttributionConfig) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }

  async post(attr: Attribution, cid: string, uri: string): Promise<void> {

    const attributionEntries = new AttributionEntries(
      {key: "Author", value: attr.author, maxLength: 90},
      {key: "Date", value: attr.date, maxLength: 90},
      {key: "Licence", value: attr.licence, maxLength: 90, link: attr.licenceUrl},
      {key: "Source", value: attr.url, link: attr.url}
    )

    console.log("attribution entries:", JSON.stringify(attributionEntries.entries, null, 2))
    console.log("attribution", attributionEntries.attributionText())
    console.log("facets", JSON.stringify(attributionEntries.facets()), null, 2)

    await this.agent.login({identifier: this.config.username, password: this.config.password})
    await this.agent.post({
      text: attributionEntries.attributionText(),
      facets: attributionEntries.facets(),
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
