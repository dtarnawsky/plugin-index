import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readPlugin, readPluginList } from "./catalog.js";
import { PluginInfo } from "./plugin-info.js";
import { PluginSummary, Summary } from "./summary.js";

/**
 * Creates the summarized result files
 */
export function prepare() {
    // www and history folders needed
    if (!existsSync('www')) {
        mkdirSync('www');
    }
    console.log(`${reviewList('plugins.json')} working plugins found.`);
    reviewList('detailed-plugins.json', true);
    keywords();
}

function reviewList(filename: string, fullDetails?: boolean): number {
    let count = 0;
    const result: Summary = { plugins: [] };
    for (let plugin of readPluginList()) {
        const summary = review(plugin, fullDetails);
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
        const plugin = readPlugin(name);
        if (plugin && plugin.success.length > 0) {
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



function review(name: string, fullDetails: boolean): PluginSummary {
    const plugin: PluginInfo = readPlugin(name);
    if (plugin.success.length == 0) {
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
