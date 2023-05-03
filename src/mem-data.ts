import { PluginInfo } from "./plugin-info.js";

let data = {};

export function set(name: string, plugin: PluginInfo) {
    data[name] = plugin;
}

export function get(name: string): PluginInfo {
    return data[name];
}