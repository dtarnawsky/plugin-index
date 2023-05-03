import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readPlugin, readPluginList } from "./summary.js";
import { PluginInfo } from "./types/plugin.js";

interface Summary {
    plugins: PluginInfo[];
}

export function writePluginSummary(): number {
    const filename = 'detailed-plugins.json';
    if (!existsSync('www')) {
        mkdirSync('www');
    }
    let count = 0;
    const result: Summary = { plugins: [] };
    for (let plugin of readPluginList()) {
        const info: PluginInfo = readPlugin(plugin);
        if (info && info.success.length > 0) {
            result.plugins.push(info);
            count++;
        }
    }
    const indent = 2;
    writeFileSync(join('www', filename), JSON.stringify(result, undefined, indent), 'utf-8');
    return count;
}