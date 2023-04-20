import { hasData, readPlugin } from "./catalog.js";
import { Inspection } from "./inspection.js";
import { Test } from "./test.js";

export enum FilterType {
    failed,
    new,
    all,
    missing
}

export function filter(plugins: string[], filterType: FilterType): string[] {
    const result = [];
    for (const plugin of plugins) {
        const info = readPlugin(plugin);
        let include = false;
        switch (filterType) {
            case FilterType.failed: include = info.fails.length > 0; break;
            case FilterType.new: include = !hasData(plugin); break;
            case FilterType.missing: include = !hasAllTests(info); break;
            default: throw new Error(`Unknown Filter Type ${filterType}`);
        }
        if (include) {
            result.push(plugin);
        }
    }
    return result;
}

function hasAllTests(info: Inspection): boolean {
    for (const test of [
        Test.capacitorAndroid3,
        Test.capacitorAndroid4,
        Test.capacitorAndroid5,
        Test.capacitorIos3,
        Test.capacitorIos4,
        Test.capacitorIos5,
        Test.cordovaIos6,
        Test.cordovaAndroid11]) {
        if (!info.success.includes(test) && !info.fails.includes(test)) {
            return false;
        }
    }
    return true;
}