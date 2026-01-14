class Pair<T1, T2> {

  constructor(private readonly _t1: T1, private readonly _t2: T2) {
  }

  public get first(): T1 {
    return this._t1;
  }

  public get second(): T2 {
    return this._t2;
  }
}

export function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function randomElement<T>(list: T[]): T {
  const idx = Math.floor(Math.random() * list.length)
  return list[idx]
}