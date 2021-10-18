import { ServerInfo } from "lento-client";

export function getServers(): ServerInfo[] {
    return [{
        "region": "US East",
        "url": "ws://localhost:6969",
    }];
}