import { NetPacket } from "./NetType";
import { NetObjectSchema } from "./Schemas";

export interface GamePacket {
    type: NetPacket;
    data: EntityState[];
}

export interface EntityState {
    id: number;
    type: number;
    data: NetObjectSchema;
}

/*
export function readGamePacket(): GamePacket {
}
*/