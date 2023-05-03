import { store, readPluginList, readPlugin } from './summary.js';
import { writePluginSummary } from './write.js';
import { checkSecretsAreSet, secretList } from './secrets.js';
import { PluginInfo } from './plugin-info.js';
import { applyNpmDownloads, applyNpmInfo } from './npm.js';
import { applyGithubInfo } from './github.js';

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

async function inspectPlugin(name: string): Promise<PluginInfo> {
    const plugin: PluginInfo = readPlugin(name);
    await Promise.all([applyNpmInfo(plugin), applyNpmDownloads(plugin)]);

    if (plugin.repo?.includes('github.com')) {
        await applyGithubInfo(plugin);
    }
    return plugin;
}