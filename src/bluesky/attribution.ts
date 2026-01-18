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

export class AttributionEntries {
  readonly entries: AttributionEntry[]


  constructor(...entries: { key: string, value: string, maxLength?: number, link?: string }[]) {
    const newline = 1
    const calculateNextOffset = (e: AttributionEntry) => e.offset + e.attributionLength + newline

    this.entries = entries.reduce(
      (acc, {key, value, maxLength, link}) =>
        [...acc, new AttributionEntry(acc.length > 0 ? calculateNextOffset(acc.at(-1)) : 0, key, value, maxLength, link)],
      [] as AttributionEntry[]
    )
  }

  attributionText(): string {
    return this.entries.map((e) => e.attribution)
      .join("\n")
      .slice(0, 300)
  }

  facets: () => linkFacet[] = () =>
    this.entries.flatMap(e => e.facets());

}

class AttributionEntry {
  private readonly _attribution: string;
  private readonly _attributionLength: number;

  constructor(
    public readonly offset: number,
    key: string,
    private readonly value: string,
    maxLength?: number,
    private readonly link?: string
  ) {
    const text = `${key}: ${value}`;
    this._attribution = maxLength ? text.slice(0, maxLength) : text
    this._attributionLength = utf8Length(this._attribution)
  }

  facets: () => linkFacet[] = () => {
    return this.link ? [{
      index: {
        byteStart: this.offset + this._attributionLength - utf8Length(this.value),
        byteEnd: this.offset + this._attributionLength
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: this.link
      }]
    }] : []
  }

  get attributionLength(): number {
    return this._attributionLength;
  }

  get attribution(): string {
    return this._attribution;
  }

}

const encoder = new TextEncoder()

function utf8Length(str: string): number {
  return encoder.encode(str).length
}