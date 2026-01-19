export interface Attribution {
  author: string,
  date: string,
  licence: string,
  licenceUrl: string,
  url: string,
}

export interface WikimediaObject {
  description: string
  image: Blob
  attribution: Attribution
}
export interface ExtMetadata {
  Artist: {
    value: string
  },
  ImageDescription: {
    value: string
  },
  ObjectName: {
    value: string
  },
  DateTimeOriginal: {
    value: string
  },
  DateTime: {
    value: string
  },
  LicenseShortName: {
    value: string
  },
  LicenseUrl: {
    value: string
  },
  UsageTerms: {
    value: string
  }
}

export interface ImageInfo {
  size: number,
  width: number,
  height: number,
  url: string,
  descriptionurl: string,
  descriptionshorturl: string,
  extmetadata: ExtMetadata
}

export interface ImageInfoResponse {
  query: {
    pages: [
      {
        imageinfo: [ImageInfo]
      }
    ]
  }
}

export class HttpStatusError extends Error {
  constructor(public readonly status: number, message?: string) {
    super((message + ' ' || '') + `HTTP status ${status}`)
  }
}

type Option<T> = T | null

export function optional<T>(value: T | null | undefined): Option<T> {
  return value === null || value === undefined ? null : value
}

export function isEmpty<T>(o: Option<T>): boolean {
  return o === null
}

export function get<T>(o: Option<T>): T {
  if (isEmpty(o)) throw new Error('Trying to get the value of an empty option')
  return o
}

export function map<T, U>(o: Option<T>, f: (t: T) => U): Option<U> {
  return o === null ? null : f(o)
}
