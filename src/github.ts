import { httpGet } from './cache.js';
import { Inspection } from './inspection.js';

interface GitHubInfo {
    id: number
    node_id: string
    name: string
    full_name: string
    private: boolean
    owner: Owner
    html_url: string
    description: string
    fork: boolean
    url: string
    forks_url: string
    keys_url: string
    collaborators_url: string
    teams_url: string
    hooks_url: string
    issue_events_url: string
    events_url: string
    assignees_url: string
    branches_url: string
    tags_url: string
    blobs_url: string
    git_tags_url: string
    git_refs_url: string
    trees_url: string
    statuses_url: string
    languages_url: string
    stargazers_url: string
    contributors_url: string
    subscribers_url: string
    subscription_url: string
    commits_url: string
    git_commits_url: string
    comments_url: string
    issue_comment_url: string
    contents_url: string
    compare_url: string
    merges_url: string
    archive_url: string
    downloads_url: string
    issues_url: string
    pulls_url: string
    milestones_url: string
    notifications_url: string
    labels_url: string
    releases_url: string
    deployments_url: string
    created_at: string
    updated_at: string
    pushed_at: string
    git_url: string
    ssh_url: string
    clone_url: string
    svn_url: string
    homepage: string
    size: number
    stargazers_count: number
    watchers_count: number
    language: string
    has_issues: boolean
    has_projects: boolean
    has_downloads: boolean
    has_wiki: boolean
    has_pages: boolean
    has_discussions: boolean
    forks_count: number
    mirror_url: any
    archived: boolean
    disabled: boolean
    open_issues_count: number
    license: License
    allow_forking: boolean
    is_template: boolean
    web_commit_signoff_required: boolean
    topics: string[]
    visibility: string
    forks: number
    open_issues: number
    watchers: number
    default_branch: string
    temp_clone_token: any
    organization: Organization
    network_count: number
    subscribers_count: number
}

export interface Owner {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
}

interface License {
    key: string
    name: string
    spdx_id: string
    url: string
    node_id: string
}

interface Organization {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
}

export async function inspectGitHubAPI(item: Inspection) {
    try {
        // call api (eg https://api.github.com/repos/capawesome-team/capacitor-mlkit) and get GitHubInfo

        // https://github.com/capacitor-community/capacitor-googlemaps-native.git
        let part = item.repo.replace('https://github.com/', '').replace('.git', '').replace('ssh://git@', '');
        if (part.includes('#')) {
            part = part.substring(0, part.indexOf('#')-1);
        }
        let token = process.env.GH_PERSONAL_TOKEN;

        // TOKEN should be able to get info on private package
        if (item.name.startsWith('@ionic-enterprise')) {
            token = process.env.GH_PERSONAL_TOKEN_IONIC;
        }
        let headers = {};
        if (!token || token == '') {
            console.warn(`GitHub API calls may be rate limited because you have not set environment variable GH_PERSONAL_TOKEN (https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#using-a-token-on-the-command-line)`);
        } else {
            headers = { Authorization: `Bearer ${token}` };
        }
        
        let retry = true;
        let gh: GitHubInfo;
        while (retry) {
            retry = false;            
            gh = await httpGet(`https://api.github.com/repos/${part}`, { headers });
            if (gh.stargazers_count == undefined) {
                if ((gh as any).message?.startsWith('API rate limit exceeded')) {
                    console.log(`Github API is rate limited.`);
                    retry = true;
                    sleep(3000);
                } else if ((gh as any).message?.startsWith('Not Found')) {
                    item.repo = undefined;
                } else if (gh.full_name != part) {
                    console.error(`Failed to get info on repo ${part}`);
                    console.error(gh);
                } else {
                    item.stars = 0;
                }
                return;
            }
        }
        item.stars = gh.stargazers_count;
        item.image = gh.owner?.avatar_url;
        item.fork = gh.fork;
        if (!item.keywords) {
            item.keywords = [];
        }
        if (gh.topics) {
            for (const topic of gh.topics) {

                if (!item.keywords.includes(topic)) {
                    item.keywords.push(topic);
                }
            }
        }
        if (!item.description) {
            item.description = gh.description;
        }
        item.quality = 0;
        item.updated = gh.updated_at;
        item.quality += gh.open_issues_count;
        item.quality += gh.watchers_count;
        item.quality += gh.forks_count;
        if (!gh.fork) {
            item.quality += 100;
        }
    } catch (error) {
        console.error('inspectGitHubAPI Failed', error);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}