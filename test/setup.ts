import {Polly} from "@pollyjs/core";
import FSPersister from "@pollyjs/persister-fs";
import FetchAdapter from "@pollyjs/adapter-fetch";

Polly.register(FSPersister);
Polly.register(FetchAdapter);

const polly = new Polly('WikimediaService', {
  adapters: ['fetch'],
  persister: 'fs',
  recordIfMissing: false,
  logLevel: 'error',
  persisterOptions: {
    keepUnusedRequests: true,
    fs: {
      recordingsDir: './test/__recordings__'
    }
  }
})

afterEach(() => polly.stop())
