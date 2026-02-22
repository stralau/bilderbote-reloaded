import {AttributionEntries, AttributionEntry, utf8Length} from "../util/attributionEntries.js";
import {Attribution} from "../types/types.js";

type linkFacet = {
  index: {
    byteStart: number,
    byteEnd: number
  },
  features: [{
    $type: 'app.bsky.richtext.facet#link',
    uri: string
  }]
}

export class BlueskyAttributionEntries {
  get attributionEntries(): AttributionEntries {
    return this._attributionEntries;
  }
  private readonly _attributionEntries: AttributionEntries

  constructor(attribution: Attribution) {
    this._attributionEntries = new AttributionEntries(attribution, 300)
  }

  attributionText(): string {
    return this._attributionEntries.attributionText()
  }

  facets: () => linkFacet[] = () =>
    this._attributionEntries.entries.flatMap((e: AttributionEntry) =>
      e.link ? [{
        index: {
          byteStart: e.offset + e.attributionLength - utf8Length(e.value),
          byteEnd: e.offset + e.attributionLength
        },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: e.link
        }]
      }] : []);
}