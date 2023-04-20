import { Inspection } from "./inspection.js";

let data = {};

export function set(name: string, plugin: Inspection) {
    data[name] = plugin;
}

export function get(name: string): Inspection {
    return data[name];
}

export function clear(name: string) {
    if (data[name]) {
        delete data[name];
    }
}