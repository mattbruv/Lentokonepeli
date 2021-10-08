import { EntityType } from "./EntityType";
import { NetType } from "./NetType";

export interface NetObjectSchema {
    [key: string]: NetType;
};

const ManSchema: NetObjectSchema = {
    x: NetType.i16,
    y: NetType.i16,
}

const GroundSchema: NetObjectSchema = {
    x: NetType.i16,
    y: NetType.i16,
    width: NetType.u16,
    type: NetType.u8
}

export function getSchema(type: EntityType): NetObjectSchema {
    switch (type) {
        case EntityType.MAN:
            return ManSchema;
        case EntityType.GROUND:
            return GroundSchema;
        default:
            throw new Error("Unimplemented Schema type: " + type);
    }
}