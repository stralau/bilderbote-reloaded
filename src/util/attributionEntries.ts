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
    private getLength: (str: string) => number,
    maxLength?: number,
    private readonly _link?: string,
  ) {
    const text = `${key}: ${_value}`;
    this._attributionLength = getLength(text)
    this._attribution = (maxLength && this._attributionLength > maxLength) ? text.slice(0, maxLength) : text
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

  constructor(attribution: Attribution, private readonly maxLength: number, private getLength: (str: string) => number = utf8Length) {

    const urlLength = attribution.url ? getLength(attribution.url) : 0
    const newLines = 3
    const entryMaxLength = (maxLength - urlLength - newLines) / 3

    if (entryMaxLength < 1) throw new Error("Attribution entries too long")

    const entries = [
      attribution.author ? {key: "Author", value: attribution.author, maxLength: entryMaxLength} : [],
      attribution.date ? {key: "Date", value: attribution.date, maxLength: entryMaxLength} : [],
      attribution.licence ? {key: "Licence", value: attribution.licence, maxLength: entryMaxLength, link: attribution.licenceUrl} : [],
      attribution.url ? {key: "Source", value: attribution.url, link: attribution.url} : []
    ].flat()


    const newline = 1
    const calculateNextOffset = (e: AttributionEntry) => e.offset + e.attributionLength + newline

    this._entries = entries.reduce(
      (acc, {key, value, maxLength, link}) => {
        const offset = acc.length > 0 ? calculateNextOffset(acc.at(-1)) : 0;
        const entry = new AttributionEntry(offset, key, value, getLength, maxLength, link);
        return [...acc, entry];
      },
      [] as AttributionEntry[]
    )
  }

  attributionText(): string {
    return this._entries.map((e) => e.attribution)
      .join("\n")
  }

  get entries(): AttributionEntry[] {
    return this._entries;
  }
}

const encoder = new TextEncoder()

export function utf8Length(str: string): number {
  return encoder.encode(str).length
}