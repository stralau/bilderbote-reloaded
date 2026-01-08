export class Result<T, E = Error > {
  constructor(public readonly success: boolean, public readonly value?: T, public readonly error?: E) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result(true, value)
  }

  static err<T, E = Error>(error: E): Result<T, E> {
    return new Result(false, undefined, error)
  }

  static succeed(): Result<void, never> {
    return new Result(true)
  }

  map<T,U>(fn: (T) => U): Result<U, E> {
    return this.success === true ? Result.ok(fn(this.value as any as U)) : Result.err<U, E>(this.error)
  }

  flatMap<T,U>(fn: (T) => Result<U, E>): Result<U, E> {
    return this.success === true ? fn(this.value as any as U) : Result.err<U, E>(this.error)
  }

  mapError<E2>(fn: (E) => E2): Result<T, E2> {
    return this.success === true ? Result.ok(this.value as any as T) : Result.err<T, E2>(fn(this.error))
  }

  onError(fn: (E) => void): Result<T, E> {
    if (this.success === false) fn(this.error)
    return this
  }

  get(): T {
    if (this.success === false) {
      console.error(this.error)
      throw this.error
    }
    return this.value
  }
}
