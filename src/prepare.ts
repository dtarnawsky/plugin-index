import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readPlugin, readPluginList } from "./catalog.js";
import { Inspection } from "./inspection.js";
import { PluginSummary, Summary } from "./summary.js";
import { Test } from "./test.js";

enum SummaryFilter {
    All,
    Problem, // Plugins that will not build
    Capacitor3, // Works with Capacitor 3
    Capacitor4, // Works with Capacitor 4
    Capacitor5, // Works with Capacitor 5
    Cordova611 // Works with Cordova iOS 6 and Cordova Android 11
}

/**
 * Creates the summarized result files
 */
export function prepare() {
    // www and history folders needed
    if (!existsSync('www')) {
        mkdirSync('www');
    }
    console.log(`${reviewList('plugins.json', SummaryFilter.All)} working plugins found.`);
    reviewList('detailed-plugins.json', SummaryFilter.All, true);
    keywords();
}

function reviewList(filename: string, filter: SummaryFilter, fullDetails?: boolean): number {
    let count = 0;
    const result: Summary = { plugins: [] };
    for (let plugin of readPluginList()) {
        const summary = review(plugin, filter, fullDetails);
        if (summary) {
            result.plugins.push(summary);
            count++;
        }

    }
    const indent = 2;
    writeFileSync(join('www', filename), JSON.stringify(result, undefined, indent), 'utf-8');
    return count;
}

function keywords() {
    const result = [];
    for (let name of readPluginList()) {
        const plugin = filtered(readPlugin(name), SummaryFilter.All);
        if (plugin) {
            if (plugin.keywords) {
                for (const keyword of plugin.keywords) {
                    if (!result.includes(keyword)) {
                        result.push(keyword);
                    }
                }
            } else {
                console.warn(`${name} has missing keywords`);
            }
        }
    }
    result.sort();
    writeFileSync(join('www', 'keywords.json'), JSON.stringify(result, undefined, 2), 'utf-8');
    console.log(`${result.length} keywords found`);
}

function filtered(plugin: Inspection, filter: SummaryFilter): Inspection {
    switch (filter) {
        case SummaryFilter.All: {
            if (plugin.success.length > 0) {
                return plugin;
            }
            break;
        }
        case SummaryFilter.Problem: {
            if (plugin.success.length == 0) {
                plugin.keywords = undefined;
                plugin.description = undefined;
                return plugin;
            }
            break;
        }
        case SummaryFilter.Cordova611: {
            if (plugin.success.includes(Test.cordovaAndroid11) || plugin.success.includes(Test.cordovaIos6)) {
                return plugin;
            }
            break;            
        }
        case SummaryFilter.Capacitor4: {
            if (plugin.success.includes(Test.capacitorIos4) || plugin.success.includes(Test.capacitorAndroid4)) {
                return plugin;
            }
            break;
        }
        case SummaryFilter.Capacitor5: {
            if (plugin.success.includes(Test.capacitorIos5) || plugin.success.includes(Test.capacitorAndroid5)) {
                return plugin;
            }
            break;
        }        
        case SummaryFilter.Capacitor3: {
            if (plugin.success.includes(Test.capacitorIos3) || plugin.success.includes(Test.capacitorAndroid3)) {
                return plugin;
            }
            break;
        }
    }
    return undefined;
}

function review(name: string, filter: SummaryFilter, fullDetails: boolean): PluginSummary {
    const plugin: Inspection = readPlugin(name);
    if (!filtered(plugin, filter)) {
        return undefined;
    }
    if (fullDetails) {
        return (plugin as any);
    }
    return {
        name: plugin.name,
        description: plugin.description,
        keywords: plugin.keywords
    }
}
