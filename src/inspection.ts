import { Test } from './test.js';

export interface Inspection {
    name: string,
    author: string,
    published: string, // Date Time published to npm
    license: string, // eg MIT
    version: string,
    versions: string[],
    keywords: string[],
    repo: string,
    success: Test[],
    fails: Test[],
    platforms: string[], // Platforms supported
    bugs?: string, // URL for bugs
    stars?: number, // Github stars
    image?: string, // Github author url
    fork: boolean, // Github - is a fork    
    description?: string, // Github description
    quality?: number, // Calculation
    downloads?: number, // NPM Downloads in last month
    updated?: string // Github date last updated 
}

