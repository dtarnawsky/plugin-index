import { inspectPlugin } from './inspect.js';
import { store, readPluginList } from './summary.js';
import { writePluginSummary } from './write.js';
import { checkSecretsAreSet, secretList } from './secrets.js';

const args = process.argv;
const dep = args[2];


if (!checkSecretsAreSet()) {
    console.error(`Some required variables are not set (${secretList()})`)
    process.exit();
}

if (!dep) {
    console.log('Inspecting all plugins...');
    inspectPlugins(readPluginList());
} else {
    console.log(`Inspecting ${dep}...`);
    inspectPlugins([dep]);
}

async function inspectPlugins(plugins: string[]) {
    let count = 0;

    for (const plugin of plugins) {
        count++;
        console.log(`Inspecting ${count} of ${plugins.length}: ${plugin}`);
        store(await inspectPlugin(plugin));
    }
    const wrote = writePluginSummary();
    console.log(`${wrote} working plugins found.`);
}