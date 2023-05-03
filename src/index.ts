import { inspect } from './inspect.js';
import { catalog, readPluginList } from './catalog.js';
import { hasArg } from './utils.js';

import { prepare } from './prepare.js';
import { checkSecretsAreSet, secretList } from './secrets.js';

const args = process.argv;
const dep = args[2];


if (!checkSecretsAreSet()) {
    console.error(`Some required variables are not set (${secretList()})`)
    process.exit();
}

if (hasArg('all', args) || !dep) {
    console.log('Inspecting all plugins...');
    go(readPluginList());
} else {
    console.log(`Inspecting ${dep}...`);
    go([dep]);
}

async function go(plugins: string[]) {
    let count = 0;

    for (const plugin of plugins) {
        count++;
        console.log(`Inspecting ${count} of ${plugins.length}: ${plugin}`);
        catalog(await inspect(plugin));

    }
    prepare();
}