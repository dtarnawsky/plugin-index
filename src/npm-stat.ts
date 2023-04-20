import { Inspection } from "./inspection.js";

export interface NPMInfo {
    downloads: number
    start: string
    end: string
    package: string
  }

export async function inspectNpmAPI(item: Inspection) {
    try {
        const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${item.name}`);
        const np: NPMInfo = await response.json() as NPMInfo;
        item.downloads = np.downloads;
    } catch (error) {
        console.error('inspectNpmAPI Failed', error);
    }
}