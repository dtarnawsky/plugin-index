import { httpGet } from "./http.js"
import { PluginInfo } from "./plugin-info.js"
import { getNpmToken } from "./secrets.js"
import { removeFromPluginList } from "./summary.js"
import { cordovaTestNames, maxCapacitorVersion, minCapacitorVersion, testNames } from "./test.js"

export async function applyNpmInfo(plugin: PluginInfo) {
  let v, vlatest: NpmInfo;
  v = await getNpmInfo(plugin.name, false);
  vlatest = await getNpmInfo(plugin.name, true); // This get additional package info

  plugin.version = v.version;
  plugin.versions = v.versions;
  plugin.author = v.author;
  plugin.description = v.description;
  plugin.bugs = v.bugs?.url;
  plugin.published = v.time[v.version];
  if (!plugin.published) {
      plugin.published = v?.created;
  }
  plugin.license = v.license;
  plugin.repo = cleanUrl(v.repository?.url);
  plugin.keywords = v.keywords;
  if (vlatest.cordova) {
      plugin.platforms = vlatest.cordova.platforms;
  }
  if (vlatest.capacitor) {
      plugin.platforms = [];
      if (vlatest.capacitor.ios) plugin.platforms.push('ios');
      if (vlatest.capacitor.android) plugin.platforms.push('android');
  }

  plugin.success = [...getCapacitorVersions(vlatest), ...getCordovaVersions(vlatest)] as any;
  plugin.success = cleanupBasedOnPlatforms(plugin.success, plugin.platforms);
  plugin.fails = [];
  for (const test of testNames()) {
      if (!plugin.success.includes(test)) {
          plugin.fails.push(test);
      }
  }
}

export async function applyNpmDownloads(plugin: PluginInfo) {
  try {
    const np: NpmDownloads = await httpGet(`https://api.npmjs.org/downloads/point/last-month/${plugin.name}`, npmHeaders());
    plugin.downloads = np.downloads;
  } catch (error) {
    console.error('inspectNpmAPI Failed', error.message);
  }
}

async function getNpmInfo(name: string, latest: boolean): Promise<NpmInfo> {
  let url = '';
  try {
    url = latest
      ? `https://registry.npmjs.org/${name}/latest`
      : `https://registry.npmjs.org/${name}`;
    const np: NpmInfo = await httpGet(url, npmHeaders());
    np.versions = undefined;
    np.version = np['dist-tags'] ? np['dist-tags'].latest : np.version;
    return np;
  } catch (error) {
    console.error(`getNpmInfo Failed ${url}`, error);
  }
}

function npmHeaders(): any {
  return {
    headers: {
      Authorization: `bearer ${getNpmToken()}`,
      'User-Agent': 'Ionic Plugin Explorer',
      Accept: '*/*'
    }
  };
}

function cleanUrl(url: string): string {
  if (url) {
      return url.replace('git+', '');
  }
  return url;
}

function cleanupBasedOnPlatforms(tests: string[], platforms: string[]): string[] {
  return tests.filter((test) => {
      return (test.includes('ios') && platforms.includes('ios')) ||
          (test.includes('android') && platforms.includes('android'))
  });
}

function getCapacitorVersions(p: NpmInfo): string[] {
  let cap: string = capCoreDeps(p);
  const result = [];
  if (likelyCordova(p)) {
      const t = [];
      for (let version = minCapacitorVersion; version <= maxCapacitorVersion; version++) {
          t.push(`^${version}.0.0`);
      }
      cap = t.join(' | ');
  }
  for (let version = minCapacitorVersion; version <= maxCapacitorVersion; version++) {
      let match = false;

      if (cap?.includes(`>`) && !cap?.includes(`>=`)) {
          const t = cap.split('>');
          const min = parseInt(t[1].trim());
          if (version > min) {
              match = true;
          }
      } else if (cap?.includes(`>=`)) {
          const t = cap.split('>=');
          const min = parseInt(t[1].trim());
          if (version >= min) {
              match = true;
          }
      }
      if (cap?.includes(`^${version}`) || cap?.includes(`>=${version}`) || match) {
          result.push(`capacitor-ios-${version}`);
          result.push(`capacitor-android-${version}`);
      }
  }
  if (result.length == 0) {
      if (!likelyCordova(p)) {
          if (!cap) {
              console.error(`Error: ${p.name} does not seem to be Capacitor or Cordova based. The package will be removed.`);
              removeFromPluginList(p.name);
          } else {
              console.error(`Warning ${p.name} is Capacitor based but dependent on @capacitor/core "${cap}"`);
          }
      }
  }
  return result;
}

function capCoreDeps(p: NpmInfo): string {
  let cap = p.peerDependencies ? p.peerDependencies['@capacitor/core'] : undefined;
  if (!cap) {
      cap = p.dependencies ? p.dependencies['@capacitor/core'] : undefined;
      if (!cap) {
          cap = p.devDependencies ? p.devDependencies['@capacitor/core'] : undefined;
          if (!cap) {
              cap = p.devDependencies ? p.devDependencies['@capacitor/ios'] : undefined;
          } else if (!cap) {
              cap = p.devDependencies ? p.devDependencies['@capacitor/android'] : undefined;
          }
      }
  }
  return cap;
}

function likelyCordova(p: NpmInfo): boolean {
  if (p.cordova?.platforms) return true;
  if (p.engines && p.engines['cordova']) return true;
  if (p.dependencies && p.dependencies['cordova-android']) return true;
  if (p.dependencies && p.dependencies['cordova-ios']) return true;
  if (p.name.includes('cordova-')) return true; // We dont extract the package to see if there is a plugin.xml but this is close enough
  return false;
}

function getCordovaVersions(p: NpmInfo): string[] {
  const result = [];
  const isCapacitor = !!capCoreDeps(p);

  if (!isCapacitor && likelyCordova(p)) {
      for (let cordova of cordovaTestNames()) {
          result.push(cordova);
      }
  }
  return result;
}

interface NpmInfo {
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

interface CordovaInfo {
  platforms: string[]
}

interface CapacitorInfo {
  ios: any;
  android: any;
}

interface DistTags {
  latest: string
  next: string
}

interface Repository {
  type: string
  url: string
}

interface Bugs {
  url: string
}

interface Dist {
  integrity: string
  shasum: string
  tarball: string
  fileCount: number
  unpackedSize: number
  signatures: Signature[]
  "npm-signature": string
}

interface Signature {
  keyid: string
  sig: string
}

interface Directories { }

interface NpmOperationalInternal {
  host: string
  tmp: string
}

interface NpmDownloads {
  downloads: number
  start: string
  end: string
  package: string
}