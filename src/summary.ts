export interface Summary {
   plugins: PluginSummary[];
}

export interface PluginSummary {
    name: string;
    description: string;
    keywords: string[];
}