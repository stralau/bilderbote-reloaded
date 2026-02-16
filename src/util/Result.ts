export class Result<T, E = Error> {
  constructor(public readonly r: { success: true; value: T } | { success: false; error: E }) {
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result({success: true, value: value})
  }

  static err<T, E = Error>(error: E): Result<T, E> {
    return new Result({success: false, error: error})
  }

  static async tryAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
    try {
      return Result.ok<T, E>(await fn());
    } catch (err) {
      return Result.err<T, E>(err);
    }
  }

  success(): boolean {
    return this.r.success === true
  }

  map<U>(fn: (t: T) => U): Result<U, E> {
    return this.r.success === true ? Result.ok(fn(this.r.value)) : Result.err<U, E>(this.r.error)
  }

  flatMap<U>(fn: (t: T) => Result<U, E>): Result<U, E> {
    return this.r.success === true ? fn(this.r.value) : Result.err<U, E>(this.r.error)
  }

  filter(p: (t: T) => true | E): Result<T, E> {
    if (!this.success()) {
      return this
    }

    const res = p(this.get())

    if (res === true) {
      return this
    }

    return Result.err(res)
  }

  mapError<E2>(fn: (e: E) => E2): Result<T, E2> {
    return this.r.success === true ? Result.ok(this.r.value as any as T) : Result.err<T, E2>(fn(this.r.error))
  }

  onError(fn: (e: E) => void): Result<T, E> {
    if (this.r.success === false) fn(this.r.error)
    return this
  }

  get(): T {
    if (this.r.success === false) {
      throw this.r.error
    }
    return this.r.value
  }
}
