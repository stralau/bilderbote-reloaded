import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import path from "path";

const versionFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "version.json");

let version: string;
try {
  const {sha, message} = JSON.parse(readFileSync(versionFile, "utf-8"));
  version = `${sha} ${message}`;
} catch {
  version = "unknown";
}

export {version};