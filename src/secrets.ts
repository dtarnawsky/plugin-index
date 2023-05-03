export function getNpmToken() {
    return process.env.NPM_PERSONAL_TOKEN;
}

export function getGitHubToken() {
    return process.env.GH_PERSONAL_TOKEN;
}

// This token is from the Ionic org and allows access to private repos like @ionic-enterprise/*
export function getIonicGithubToken() {
    return process.env.GH_PERSONAL_TOKEN_IONIC;    
}

export function secretList(): string {
    return 'NPM_PERSONAL_TOKEN, GH_PERSONAL_TOKEN, GH_PERSONAL_TOKEN_IONIC'
}

export function checkSecretsAreSet(): boolean {
    if (!getNpmToken()) {
        console.error(`GH_PERSONAL_TOKEN is undefined`);
        return false;
    }
    if (!getGitHubToken()) {
        console.error(`GH_PERSONAL_TOKEN_IONIC is undefined`);
        return false;
    }
    if (!getIonicGithubToken()) {
        return false;
    }
    return true;
}