import {Result} from "./Result";

interface Retry<T> {
  fn: () => Promise<Result<T>>,
  attempts: number,
  isFatal?: (e: Error) => boolean | undefined
}

export async function retry<T>(r: Retry<T>): Promise<Result<T>> {

  if (r.attempts < 1) {
    console.log(r.attempts)
    return Result.err(new Error("Number of attempts must be at least 1"))
  }

  if (r.attempts == 1) {
    return r.fn()
      .then(r => r.mapError(e => new Error(`Gave up retrying, last error: ${e.message}`)))
  }

  const result = await r.fn()
  if (result.success || r.isFatal && r.isFatal(result.error)) return result
  return retry({...r, attempts: r.attempts - 1})

}
