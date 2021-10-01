export type APIPacketOut =
    ServerInfoPayload |
    PongPayload

export enum APIPacketOutType {
    SERVER_INFO,
    PONG
}

export interface ServerInfo {
    url: string;
    region: string;
}

export interface ServerInfoPayload {
    type: APIPacketOutType.SERVER_INFO;
    servers: ServerInfo[];
}

export interface PongPayload {
    type: APIPacketOutType.PONG;
}