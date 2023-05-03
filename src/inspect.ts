import { PluginInfo } from './plugin-info.js';
import { testNames, maxCapacitorVersion, minCapacitorVersion, cordovaTestNames } from './test.js';
import { NpmInfo, getNpmInfo, applyNpmDownloads } from './npm.js';
import { readPlugin, removeFromPluginList } from './summary.js';
import { applyGithubInfo } from './github.js';

export async function inspectPlugin(name: string): Promise<PluginInfo> {
    const plugin: PluginInfo = readPlugin(name);
    await applyNpmInfo(plugin);

    if (plugin.repo?.includes('github.com')) {
        await applyGithubInfo(plugin);
    }
    await applyNpmDownloads(plugin);
    return plugin;
}

async function applyNpmInfo(plugin: PluginInfo) {
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
