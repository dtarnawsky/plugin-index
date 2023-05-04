import { httpGet, rateLimited } from './http.js';
import { PluginInfo } from './types/plugin.js';
import { GitHubInfo } from './types/github.js';
import { getGitHubToken, getIonicGithubToken } from './secrets.js';

export async function applyGithubInfo(plugin: PluginInfo) {
    try {
        // call api (eg https://api.github.com/repos/capawesome-team/capacitor-mlkit) and get GitHubInfo
        let part = plugin.repo.replace('https://github.com/', '').replace('.git', '').replace('ssh://git@', '');
        if (part.includes('#')) {
            part = part.substring(0, part.indexOf('#') - 1);
        }
        let token = getGitHubToken();

        // TOKEN should be able to get info on private package
        if (plugin.name.startsWith('@ionic-enterprise')) {
            token = getIonicGithubToken();
        }
        const headers = { Authorization: `Bearer ${token}` };
        let retry = true;
        let gh: GitHubInfo;
        let count = 0;
        while (retry) {
            retry = false;
            gh = await httpGet(`https://api.github.com/repos/${part}`, { headers });
            if (gh.stargazers_count == undefined) {
                if (rateLimited(gh)) {
                    retry = true;
                    count++;
                    console.log(`   Retry ${count} for ${part}`);
                    await sleep(1000 + Math.random() * 10000);
                } else if ((gh as any).message?.startsWith('Not Found')) {
                    plugin.repo = undefined;
                } else if (gh.full_name != part) {
                    console.error(`Failed to get info on repo ${part}`);
                    console.error(gh);
                } else {
                    plugin.stars = 0;
                }
            }
        }
        plugin.stars = gh.stargazers_count;
        plugin.image = gh.owner?.avatar_url;
        plugin.fork = gh.fork;
        if (!plugin.keywords) {
            plugin.keywords = [];
        }
        if (gh.topics) {
            for (const topic of gh.topics) {
                if (!plugin.keywords.includes(topic)) {
                    plugin.keywords.push(topic);
                }
            }
        }
        if (!plugin.description) {
            plugin.description = gh.description;
        }
        plugin.quality = 0;
        plugin.updated = gh.updated_at;
        plugin.quality += gh.open_issues_count;
        plugin.quality += gh.watchers_count;
        plugin.quality += gh.forks_count;
        if (!gh.fork) {
            plugin.quality += 100;
        }
    } catch (error) {
        console.error('applyGithubInfo Failed', error);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}