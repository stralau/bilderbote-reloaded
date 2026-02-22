import {Attribution} from "../types/types.js";
import {Result} from "./Result.js";

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
    textMeasurer: TextMeasurer,
    maxLength?: number,
    private readonly _link?: string,
  ) {
    const text = `${key}: ${_value}`;
    const textLength = textMeasurer.getLength(text)
    this._attributionLength = (maxLength && textLength > maxLength) ? maxLength : textLength;
    this._attribution = textMeasurer.slice(text, this._attributionLength).get()
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

  constructor(attribution: Attribution, readonly maxLength: number, textMeasurer: TextMeasurer = defaultTextMeasurer) {

    const urlLength = attribution.url ? textMeasurer.getLength(attribution.url) : 0
    const newLines = 3
    const entryMaxLength = Math.floor((maxLength - urlLength - newLines) / 3)

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
        const entry = new AttributionEntry(offset, key, value, textMeasurer, maxLength, link);
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

export interface TextMeasurer {
  getLength(text: string): number
  slice(text: string, maxLength: number): Result<string>
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const defaultTextMeasurer: TextMeasurer = {
  getLength: (text: string) => utf8Length(text),
  slice: (text: string, maxLength: number) => {
    const bytes = encoder.encode(text).slice(0, maxLength);
    return Result.ok(decoder.decode(bytes));
  }
}


export function utf8Length(str: string): number {
  return encoder.encode(str).length
}