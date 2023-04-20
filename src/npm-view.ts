import { httpGet } from "./cache.js"

export interface NPMView {
  _id: string
  _rev: string
  name: string
  "dist-tags": DistTags
  versions: string[]
  time: any,
  maintainers: string[]
  description: string
  homepage: string
  keywords: string[]
  repository: Repository
  author: string
  bugs: Bugs
  license: string
  readmeFilename: string
  _cached: boolean
  _contentLength: number
  version: string
  main: string
  module: string
  types: string
  unpkg: string
  scripts: any,
  devDependencies: any,
  peerDependencies: any,
  dependencies: any,
  prettier: string
  swiftlint: string,
  gitHead: string,
  engines: any,
  _nodeVersion: string
  _npmVersion: string
  dist: Dist
  cordova: CordovaInfo
  capacitor: CapacitorInfo
  _npmUser: string
  directories: Directories
  _npmOperationalInternal: NpmOperationalInternal
  _hasShrinkwrap: boolean
}

export interface CordovaInfo {
  platforms: string[]
}

export interface CapacitorInfo {
  ios: any;
  android: any;
}

export interface DistTags {
  latest: string
  next: string
}



export interface Repository {
  type: string
  url: string
}

export interface Bugs {
  url: string
}



export interface Dist {
  integrity: string
  shasum: string
  tarball: string
  fileCount: number
  unpackedSize: number
  signatures: Signature[]
  "npm-signature": string
}

export interface Signature {
  keyid: string
  sig: string
}

export interface Directories { }

export interface NpmOperationalInternal {
  host: string
  tmp: string
}

export async function getNpmView(name: string, latest: boolean): Promise<NPMView> {
  let url = '';
  try {
    const token = process.env.NPM_PERSONAL_TOKEN;
    let headers = {};
    if (!token || token == '') {
      console.warn(`NPM API calls can use a tokenby setting environment variable NPM_PERSONAL_TOKEN`);
    } else {
        headers = { Authorization: `Bearer ${token}` };
    }
    url = latest
      ? `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`
      : `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    // const response = await fetch(url, { headers });
    // const np: NPMView = await response.json() as NPMView;
    const np: NPMView = await httpGet(url, { headers });
    np.versions = undefined;
    np.version = np['dist-tags'] ? np['dist-tags'].latest : np.version;
    return np;
  } catch (error) {
    console.error(`getNpmView Failed ${url}`, error);
  }
}