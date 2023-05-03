import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PluginInfo } from './plugin-info.js';
import { hasArg } from './utils.js';
import { get, set } from './mem-data.js';

export function catalog(plugin: PluginInfo) {
    // De-duplicate tests
    plugin.fails = [...new Set(plugin.fails)];
    plugin.success = [...new Set(plugin.success)];

    // Save to data folder
    set(plugin.name, plugin);
}

export function writePluginList(name: string) {
    let lines = readPluginList();
    if (!lines.includes(name)) {
        lines.push(name);
    }
    lines.sort();
    lines = [...new Set(lines)]; // De-dup
    writeFileSync(pluginListFilename(), lines.join('\n'));
}

export function removeFromPluginList(name: string) {
    const lines = readPluginList();
    if (lines.includes(name)) {
        lines.splice(lines.indexOf(name), 1);
    }
    lines.sort();
    writeFileSync(pluginListFilename(), lines.join('\n'));
}

export function readPluginList(): string[] {
    const filename = pluginListFilename();
    let lines: string[] = [];
    if (existsSync(filename)) {
        lines = readFileSync(filename, 'utf-8').split('\n');
    }
    if (hasArg('reverse', process.argv)) {
        lines = lines.reverse();
    }
    return lines;
}

function pluginListFilename() {
    return join('data', `plugins.txt`);
}

export function hasData(plugin: string): boolean {
    return get(plugin) !== undefined;
}

export function readPlugin(plugin: string): PluginInfo {
    const data = get(plugin);
    if (data) return cleanupPlugin(data);
    return {
        name: plugin,
        version: '',
        success: [],
        repo: '',
        author: '',
        published: '',
        versions: [],
        keywords: [],
        platforms: [],
        fork: false,
        license: '',
        fails: []
    };
}

function cleanupPlugin(i: PluginInfo): PluginInfo {
    // Identity Vault has no keywords
    if (i.name == '@ionic-enterprise/identity-vault') {
        i.keywords = [
            "fingerprint",
            "authentication",
            "biometric",
            "biometrics",
            "faceid",
            "touchid",
            "face",
            "touch",
            "encryption"
        ];
    }

    i.keywords = cleanupKeywords(i.keywords);
    if (i.name?.startsWith('@capacitor/') || i.name?.startsWith('@ionic-enterprise/')) {
        i.author = 'Ionic';
        if (!i.image) {
            i.image = 'https://avatars.githubusercontent.com/u/3171503?v=4';
        }
    }
    return i;
}

// Remove keywords that add no meaning to a search
function cleanupKeywords(keywords: string[]): string[] {
    if (!keywords) return [];

    const result = [];
    for (let word of keywords) {
        if (word.includes('-')) {
            const parts = word.split('-');
            result.push(word.replace(/-/g, ' ').toLowerCase());
            for (const part of parts) {
                result.push(part.toLowerCase());
            }
        } else {
            result.push(word.toLowerCase());
        }
    }
    const words = result.filter(
        (keyword: string) =>
            ![
                'cordova',
                'javascript',
                'mobile',
                'typescript',
                'plugin',
                'capacitor',
                'mobile',
                'ecosystem:cordova',
                'capacitor plugin',
                'capacitor plugins',
                'ios',
                'package',
                'cordova windows',
                'cordova browser',
                'csharp',
                'java',
                'library',
                'ecosystem:phonegap',
                'nodejs',
                'react',
                'electron',
                'blackberry',
                'blackberry10',
                'react native',
                'community',
                'vue',
                'windows',
                'cordova electron',
                'cordova osx',
                'cplusplus',
                'objective c',
                'ionic plugin',
                'objective',
                'c',
                'osx',
                'android',
                'umd',
                'cross platform',
                'phonegap',
                'ionic',
                'capacitorjs',
                'swift',
                'java',
                'angular',
                'capacitor ios',
                'capacitor android',
                'cordova plugin',
                'cordova:plugin',
                'native',
                'capacitor community',
                'cordova ios',
                'cordova android',
            ].includes(keyword.toLowerCase())
    );
    return [...new Set(words)];
}