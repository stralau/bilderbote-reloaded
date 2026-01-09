export interface WikimediaObject {
  description: string
  image: Blob
}

export interface Elem {
  _: string
  $: {
    code: string
  }
}


export interface XmlDesc {
  response: {
    file: {
      name: string
      title: string
      size: number
      urls: {
        file: string
        description: string
        date: string
      }
    }
    licenses: {
      license: {
        name: string
      }
    }
    description: {
      language: [Elem] | Elem,
    }
  }
}


export class HttpStatusError extends Error {
  constructor(public readonly status: number, message?: string) {
    super((message + ' ' || '') + `HTTP status ${status}`)
  }
}