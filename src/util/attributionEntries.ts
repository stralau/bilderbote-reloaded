import {Attribution} from "../types/types.js";

export class AttributionEntry {
  get value(): string {
    return this._value;
  }

  get link(): string {
    return this._link;
  }

  private readonly _attribution: string;
  private readonly _attributionLength: number;

  constructor(
    public readonly offset: number,
    key: string,
    private readonly _value: string,
    maxLength?: number,
    private readonly _link?: string
  ) {
    const text = `${key}: ${_value}`;
    this._attribution = maxLength ? text.slice(0, maxLength) : text
    this._attributionLength = utf8Length(this._attribution)
  }

  get attributionLength(): number {
    return this._attributionLength;
  }

  get attribution(): string {
    return this._attribution;
  }

}

export class AttributionEntries {
  private readonly _entries: AttributionEntry[]

  constructor(attribution: Attribution, private readonly maxLength: number) {

    const entryMaxLength = (maxLength - 30) / 3
    const entries = [
      attribution.author ? {key: "Author", value: attribution.author, maxLength: entryMaxLength} : [],
      attribution.date ? {key: "Date", value: attribution.date, maxLength: entryMaxLength} : [],
      attribution.licence ? {key: "Licence", value: attribution.licence, maxLength: entryMaxLength, link: attribution.licenceUrl} : [],
      attribution.url ? {key: "Source", value: attribution.url, link: attribution.url} : []
    ].flat()


    const newline = 1
    const calculateNextOffset = (e: AttributionEntry) => e.offset + e.attributionLength + newline

    this._entries = entries.reduce(
      (acc, {key, value, maxLength, link}) =>
        [...acc, new AttributionEntry(acc.length > 0 ? calculateNextOffset(acc.at(-1)) : 0, key, value, maxLength, link)],
      [] as AttributionEntry[]
    )
  }

  attributionText(): string {
    return this._entries.map((e) => e.attribution)
      .join("\n")
      .slice(0, this.maxLength)
  }

  get entries(): AttributionEntry[] {
    return this._entries;
  }
}

const encoder = new TextEncoder()

function utf8Length(str: string): number {
  return encoder.encode(str).length
}