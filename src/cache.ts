let cache = {};

export function set(name: string, data: any) {
    cache[name] = data;
}

export function get(name: string): any {
    return cache[name];
}

export async function httpGet(url: string, opts: any): Promise<any> {
    if (get(url)) {
        return cache[url];
    }
    const response = await fetch(url, opts);
    const data = await response.json();
    if (!rateLimited(data)) {
       cache[url] = data;
    }
    return data;
}

export function rateLimited(a : any): boolean {
    return  ((a as any).message?.startsWith('API rate limit exceeded') ||
    (a as any).message?.startsWith('You have exceeded a secondary rate limit'));
}