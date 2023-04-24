import { Inspection } from './inspection.js';
import { Test, TestInfo, TestNames, maxCapacitorVersion, minCapacitorVersion } from './test.js';
import { NPMView, getNpmView, inspectNpmAPI } from './npm-view.js';
import { readPlugin } from './catalog.js';
import { inspectGitHubAPI } from './github.js';
import { FilterType } from './filter.js';

export async function inspect(plugin: string, info: TestInfo, filterType: FilterType): Promise<Inspection> {
    const result: Inspection = readPlugin(plugin);
    await prepareProject(plugin, result, info);
    if (filterType == FilterType.failed || filterType == FilterType.missing) {
        if (result.success.includes(info.android)) {
            info.android = Test.noOp;
        }
        if (result.success.includes(info.ios)) {
            info.ios = Test.noOp;
        }
    }
    return result;
}

// This returns false only if the plugin could not be found
async function prepareProject(plugin: string, result: Inspection, test: TestInfo): Promise<void> {
    const priorVersion = result.version;
    let v, vlatest: NPMView;
    try {
        // Get Latest Plugin version number
        //json = await run(`npm view ${plugin} --json`, folder);
        v = await getNpmView(plugin, false);
        vlatest = await getNpmView(plugin, true); // This get additional package info

        result.version = v.version;
        result.versions = v.versions;
        result.author = v.author;
        result.description = v.description;
        result.bugs = v.bugs?.url;
        result.published = v.time?.modified;
        result.license = v.license;
        result.repo = cleanUrl(v.repository?.url);
        result.keywords = v.keywords;
        result.success = [...getCapacitorVersions(vlatest), ...getCordovaVersions(vlatest)] as any;
        result.fails = [];
        for (const test of TestNames) {
            if (!result.success.includes(test as any)) {
                result.fails.push(test as any);
            }
        }

        if (vlatest.cordova) {
            result.platforms = vlatest.cordova.platforms;
        }
        if (vlatest.capacitor) {
            result.platforms = [];
            if (vlatest.capacitor.ios) result.platforms.push('ios');
            if (vlatest.capacitor.android) result.platforms.push('android');
        }
    } catch (error) {
        console.error(`Failed preparation for ${plugin}:${error}`);
    }

    try {
        if (result.repo?.includes('github.com')) {
            await inspectGitHubAPI(result);
        }
        await inspectNpmAPI(result);
    } catch (e) {
        console.error(`Failed preparation for ${plugin}`);
    }
}

function cleanUrl(url: string): string {
    if (url) {
        return url.replace('git+', '');
    }
    return url;
}

function getCapacitorVersions(p: NPMView): string[] {
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
                console.error(`Warning: ${p.name} does not seem to be Capacitor or Cordova based.`);
            } else {
                console.error(`Warning ${p.name} is Capacitor based but dependent on @capacitor/core "${cap}"`);
            }
        }
    }
    return result;
}

function capCoreDeps(p: NPMView): string {
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

function likelyCordova(p: NPMView): boolean {
    if (p.cordova?.platforms) return true;
    if (p.engines && p.engines['cordova']) return true;
    if (p.dependencies && p.dependencies['cordova-android']) return true;
    if (p.dependencies && p.dependencies['cordova-ios']) return true;
    if (p.name.includes('cordova-')) return true; // We dont extract the package to see if there is a plugin.xml but this is close enough
    return false;
}

function getCordovaVersions(p: NPMView): string[] {
    const result = [];
    const isCapacitor = !!capCoreDeps(p);

    if (!isCapacitor && likelyCordova(p)) {
        result.push(Test.cordovaAndroid11);
        result.push(Test.cordovaIos6);
    }
    return result;
}
