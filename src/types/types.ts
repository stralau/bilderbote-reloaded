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