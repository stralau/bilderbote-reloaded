import {Polly} from "@pollyjs/core";
import FSPersister from "@pollyjs/persister-fs";
import FetchAdapter from "@pollyjs/adapter-fetch";

beforeAll(() => {
  console.log = sanitisedLog();
})

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

function sanitisedLog(): (...data: any[]) => void {
  const log: (...data: any[]) => void = console.log

  return (...data: any[]): void => {
    if (!data.some(d => typeof d === 'string' && d.includes('[Polly] Recording may fail because the browser is offline.'))) {
      log(...data)
    }
  };
}
