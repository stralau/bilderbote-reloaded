export class HttpClient {

  public constructor(private readonly config: {userAgent: string}) {}

  public fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    if (!init) init = {};
    if (!init.headers) init.headers = {} as Record<string, string>;

    init.headers["User-Agent"] = this.config.userAgent;
    return fetch(input, init)
  }

}