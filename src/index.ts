import { inspect } from './inspect.js';
import { catalog, readPluginList, removeFromPluginList, writePluginList } from './catalog.js';
import { hasArg } from './utils.js';
import { filter, FilterType } from './filter.js';
import { Test, TestInfo } from './test.js';
import { prepare } from './prepare.js';

const args = process.argv;
const dep = args[2];

if (hasArg('all', args) || !dep) {
    console.log('Inspecting all plugins...');
    go(readPluginList(), FilterType.all);
} else if (hasArg('failed', args)) {
    console.log('Inspecting failed plugins...');
    go(filter(readPluginList(), FilterType.failed), FilterType.failed);
} else if (hasArg('new', args)) {
    console.log('Inspecting new plugins...');
    go(filter(readPluginList(), FilterType.new), FilterType.new);
} else if (hasArg('missing', args)) {
    console.log('Inspecting plugins with missing tests...');
    go(filter(readPluginList(), FilterType.missing), FilterType.missing);
} else {
    console.log(`Inspecting ${dep}...`);
    go([dep], FilterType.all);
}

async function go(plugins: string[], filterType: FilterType) {
    let count = 0;

    // Where we only do iOS or Android tests
    let android = hasArg('android', args);
    let ios = hasArg('ios', args);
    if (!android && !ios) {
        android = true;
        ios = true;
    }

    for (const plugin of plugins) {
        count++;
        console.log(`Inspecting ${count} of ${plugins.length}: ${plugin}`);                

        // Capacitor 5 test
        const capacitor5: TestInfo = {
            ios: Test.capacitorIos5,
            android: Test.capacitorAndroid5,
        }

        // Capacitor 4 test
        const capacitor4: TestInfo = {
            ios: Test.capacitorIos4,
            android: Test.capacitorAndroid4,
        }

        // Capacitor 3 test
        const capacitor3: TestInfo = {
            ios: Test.capacitorIos3,
            android: Test.capacitorAndroid3,
        }

        const cordova: TestInfo = {
            ios: Test.cordovaIos6,
            android: Test.cordovaAndroid11,
        }

        for (const test of [capacitor5, cordova, capacitor4, capacitor3]) {
            if (!android) {
                test.android = Test.noOp;
            }
            if (!ios) {
                test.ios = Test.noOp;
            }
            const inspection = await inspect(plugin, test, filterType);
            catalog(inspection);
            const removePlugin = inspection.fails.includes(Test.failedInNPM);
            if (removePlugin) {
                removeFromPluginList(inspection.name);
            } else {
                writePluginList(inspection.name);
            }
        }
    }

    prepare();
}