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