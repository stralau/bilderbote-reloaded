import {AtpAgent} from "@atproto/api";
import {Attribution} from "../types/types.js";
import {BlueskyAttributionEntries} from "./attribution.js";

interface BlueskyAttributionConfig {
  username: string,
  password: string,
  imageClientHandle: string,
}

export class AttributionClient {
  private readonly agent: AtpAgent;

  constructor(private readonly config: BlueskyAttributionConfig) {
    this.agent = new AtpAgent({
      service: 'https://bsky.social',
    })
  }

  async post(attr: Attribution, cid: string, uri: string): Promise<void> {

    const attribution = new BlueskyAttributionEntries(
      {key: "Author", value: attr.author, maxLength: 90},
      {key: "Date", value: attr.date, maxLength: 90},
      {key: "Licence", value: attr.licence, maxLength: 90, link: attr.licenceUrl},
      {key: "Source", value: attr.url, link: attr.url}
    )

    console.log("attribution entries:", JSON.stringify(attribution.attributionEntries, null, 2))
    console.log("attribution", attribution.attributionText())
    console.log("facets", JSON.stringify(attribution.facets()), null, 2)

    await this.agent.login({identifier: this.config.username, password: this.config.password})
    await this.agent.post({
      text: attribution.attributionText(),
      facets: attribution.facets(),
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
