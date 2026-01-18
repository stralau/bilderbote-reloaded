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

  constructor(...entries: { key: string, value: string, link?: string }[]) {
    const calculateNextOffset = (e: AttributionEntry) => e.offset + utf8Length(e.attributionText() + '\n')
    this.entries = entries.reduce(
      (acc, {
        key,
        value,
        link
      }) => [...acc, new AttributionEntry(acc.length > 0 ? calculateNextOffset(acc.at(-1)) : 0, key, value, link)],
      [] as AttributionEntry[]
    )
  }

  attributionText(): string {
    return this.entries.map((e) => e.attributionText())
      .join("\n")
      .slice(0, 300)
  }

  facets: () => linkFacet[] = () =>
    this.entries.flatMap(e => e.facets());

}

class AttributionEntry {

  constructor(public readonly offset: number, public readonly key: string, public readonly value: string, public readonly link?: string) {
  }

  attributionText = () => {
    return `${this.key}: ${this.value}`
  }

  facets: () => linkFacet[] = () => {
    return this.link ? [{
      index: {
        byteStart: this.offset + utf8Length(this.attributionText()) - utf8Length(this.value),
        byteEnd: this.offset + utf8Length(this.attributionText())
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: this.link
      }]
    }] : []
  }

}

const encoder = new TextEncoder()

function utf8Length(str: string): number {
  return encoder.encode(str).length
}