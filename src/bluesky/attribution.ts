import {AttributionEntries, AttributionEntry} from "../util/attributionEntries.js";

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

  constructor(...entries: { key: string, value: string, maxLength?: number, link?: string }[]) {
    this._attributionEntries = new AttributionEntries(...entries)
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

const encoder = new TextEncoder()

function utf8Length(str: string): number {
  return encoder.encode(str).length
}