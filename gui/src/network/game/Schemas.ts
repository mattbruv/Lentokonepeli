import { EntityType } from "./EntityType";
import { NetType } from "./NetType";

export interface NetObjectSchema {
    [key: string]: NetType;
};

export const ManSchema: NetObjectSchema = {
    x: NetType.i16,
    y: NetType.i16,
    name: NetType.STRING,
    test: NetType.i16,
    test2: NetType.u16,
}

export function getSchema(type: EntityType): NetObjectSchema {
    switch (type) {
        case EntityType.MAN:
            return ManSchema;
        default:
            throw new Error("Unimplemented Schema type: " + type);
    }
}