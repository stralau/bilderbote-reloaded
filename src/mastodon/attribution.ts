import {AttributionEntries, TextMeasurer, utf8Length} from "../util/attributionEntries.js";
import {Attribution} from "../types/types.js";
import {Result} from "../util/Result.js";

export class MastodonAttributionEntries extends AttributionEntries {
  constructor(attribution: Attribution) {
    super(
      attribution,
      500,
      new MastodonTextMeasurer())
  }

}

export class MastodonTextMeasurer implements TextMeasurer {
  private readonly encoder = new TextEncoder()
  private readonly decoder = new TextDecoder()

  getLength(text: string): number {
    return text
      .split(/(https?:\/\/\S+)/)
      .reduce((acc, part) =>
        acc + (part.startsWith('http') ? 23 : utf8Length(part)), 0
      );
  }

  slice(text: string, maxLength: number): Result<string> {
    if (this.getLength(text) <= maxLength)
      return Result.ok(text)

    if (!text.includes('http://') && !text.includes('https://')) {
      const bytes = this.encoder.encode(text).slice(0, maxLength);
      return Result.ok(this.decoder.decode(bytes))
    }

    return Result.err(new Error("Can't slice text with http links"))
  }

}
