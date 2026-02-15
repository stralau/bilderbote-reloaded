import {Result} from "./Result.js";

interface Retry<T> {
  fn: () => Promise<T>,
  attempts: number,
  isFatal?: (e: Error) => boolean | undefined
}

export async function retry<T>(r: Retry<T>): Promise<Result<T>> {

  if (r.attempts < 1) {
    console.log(r.attempts)
    return Result.err(new Error("Number of attempts must be at least 1"))
  }

  if (r.attempts == 1) {
    return Result.tryAsync(r.fn)
      .then(r => r.mapError(e => new Error(`Gave up retrying, last error: ${e.message}`)))
  }

  const result = await Result.tryAsync(r.fn)
  if (result.r.success === true || r.isFatal && r.isFatal(result.r.error)) return result
  console.log(`Failed with error: ${result.r.error.message}, retrying...`)
  return retry({...r, attempts: r.attempts - 1})

}
