import {Result} from "../src/types/Result";
import {describe, expect, it} from "@jest/globals";

describe('Result.ok', () => {
  it('returns a valid result', () =>
    expect(Result.ok(123).get()).toEqual(123))
})

describe('Result.err', () => {
  it('returns an error result', () =>
    expect(() => Result.err(new Error("Error!")).get()).toThrow(new Error("Error!"))
  )
})