import {describe, expect, it} from "@jest/globals";
import {Result} from "../../src/util/Result";
import {WikimediaClient} from "../../src/client/wikimedia";

describe('Fetch image', () => {
  it('returns a valid result', () =>
    expect(Result.ok(123).get()).toEqual(123))
})

test('fetch image', async () => {
  const client = new WikimediaClient({})
  await client.fetchRandomFileLocation()
})