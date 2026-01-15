export interface Attribution {
  author: string,
  date: string,
  licence: string,
  url: string,
}

export interface WikimediaObject {
  description: string
  image: Blob
  attribution: Attribution
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
      author: string;
      uploader: string;
      date: string;
      upload_date: string;
      size: number
      urls: {
        file: string
        description: string
        date: string
      }
    }
    licenses: {
      license: [{
        name: string
      }]
    }
    description: {
      language: [Elem] | Elem,
    }
  }
}

export interface ImageInfo {
  query: {
    pages: [
      {
        imageinfo: [
          {
            extmetadata: {
              Artist: {
                value: string
              }
            }
          }
        ]
      }
    ]
  }
}


export class HttpStatusError extends Error {
  constructor(public readonly status: number, message?: string) {
    super((message + ' ' || '') + `HTTP status ${status}`)
  }
}