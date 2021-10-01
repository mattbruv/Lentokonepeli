import { ServerInfo } from "lento-gui";

export function getServers(): ServerInfo[] {
    return [{
        "region": "US East",
        "url": "ws://localhost:6969",
    }];
}