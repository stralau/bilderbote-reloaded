export class Log {
  constructor(private prefix?: string) {
  }

  log(...data: any[]) {
    console.log(`${this.prefix}:`, ...data)
  }
}