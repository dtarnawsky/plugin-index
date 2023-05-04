import { httpGet } from "./http.js"
import { PluginInfo } from "./types/plugin.js"
import { getNpmToken } from "./secrets.js"
import { removeFromPluginList } from "./summary.js"
import { capacitorVersions, cordovaTestNames, testNames } from "./test.js"
import { NpmDownloads, NpmInfo } from './types/npm.js'
import { existsSync, readFileSync, writeFileSync } from "fs"

export async function applyNpmInfo(plugin: PluginInfo) {
  const [npmHistory, npmLatest] = await Promise.all([
    getNpmInfo(plugin.name, false),
    getNpmInfo(plugin.name, true)
  ]);

  plugin.version = npmHistory.version;
  plugin.versions = npmHistory.versions;
  plugin.author = npmHistory.author;
  plugin.description = npmHistory.description;
  plugin.bugs = npmHistory.bugs?.url;
  plugin.published = npmHistory.time[npmHistory.version];
  if (!plugin.published) {
    plugin.published = npmHistory?.created;
  }
  plugin.license = npmHistory.license;
  plugin.repo = cleanUrl(npmHistory.repository?.url);
  plugin.keywords = npmHistory.keywords;
  if (npmLatest.cordova) {
    plugin.platforms = npmLatest.cordova.platforms;
  }
  if (npmLatest.capacitor) {
    plugin.platforms = [];
    if (npmLatest.capacitor.ios) plugin.platforms.push('ios');
    if (npmLatest.capacitor.android) plugin.platforms.push('android');
  }

  if (!likelyCordova(npmLatest)) {
    const versions = getCapacitorVersions(npmLatest, true);
    if (versions.includes('capacitor-ios-5') || versions.includes('capacitor-android-5')) {      
      writeTo('cap5-ready.md', `- ${plugin.name} ([repo](${plugin.repo}))`);
    } else {
      if (versions.includes('capacitor-ios-4') || versions.includes('capacitor-android-4')) {        
        writeTo('cap4-help.md', `- ${plugin.name} ([repo](${plugin.repo}))`);
      }
    }
  }

  plugin.success = [...getCapacitorVersions(npmLatest, false), ...getCordovaVersions(npmLatest)] as any;
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
    console.error('applyNpmDownloads Failed', error.message);
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

function getCapacitorVersions(p: NpmInfo, peerOnly: boolean): string[] {
  let cap: string = capCoreDeps(p, peerOnly);
  const result = [];
  if (likelyCordova(p)) {
    const t = [];
    for (let version of capacitorVersions) {
      t.push(`^${version}.0.0`);
    }
    cap = t.join(' | ');
  }
  for (let version of capacitorVersions) {
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
        if (!peerOnly) {
          console.error(`Error: ${p.name} does not seem to be Capacitor or Cordova based. The package will be removed.`);
          removeFromPluginList(p.name);
        }
      } else {
        console.error(`Warning ${p.name} is Capacitor based but dependent on @capacitor/core "${cap}"`);
      }
    }
  }
  return result;
}

function capCoreDeps(p: NpmInfo, peerOnly: boolean): string {
  let cap = p.peerDependencies ? p.peerDependencies['@capacitor/core'] : undefined;
  if (peerOnly) {
    return cap;
  }
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
  const isCapacitor = !!capCoreDeps(p, false);

  if (!isCapacitor && likelyCordova(p)) {
    for (let cordova of cordovaTestNames()) {
      result.push(cordova);
    }
  }
  return result;
}

function writeTo(filename: string, message: string) {
  let data = '';
  if (existsSync(filename)) {
    data = readFileSync(filename, 'utf-8');
  }
  data += `\n${message}`;
  writeFileSync(filename, data, 'utf-8');
}