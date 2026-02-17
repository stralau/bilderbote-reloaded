import {AttributionEntries, utf8Length} from "../util/attributionEntries.js";
import {Attribution} from "../types/types.js";

export class MastodonAttributionEntries extends AttributionEntries {
  constructor(attribution: Attribution) {
    super(
      attribution,
      500,
      getLength)
  }

}


export function getLength(str: string): number {
  return str
    .split(/(https?:\/\/\S+)/)
    .reduce((acc, part) =>
      acc + (part.startsWith('http') ? 23 : utf8Length(part)), 0
    )
}
