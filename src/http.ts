export async function httpGet(url: string, opts: any): Promise<any> {
    const response = await fetch(url, opts);
    try {
        const data = await response.json();
        if (rateLimited(data)) {
            console.log(`The api call ${url} was rate limited.`)            
        }
        return data;
    } catch (error) {
        throw new Error(`Error: get ${url}: ${response.status} ${response.statusText}`);
    }
}

export function rateLimited(a: any): boolean {
    return ((a as any).message?.startsWith('API rate limit exceeded') ||
        (a as any).message?.startsWith('You have exceeded a secondary rate limit'));
}