import { NetType } from "./NetType";

export interface NetObjectSchema {
    [key: string]: NetType;
};

export const ManSchema: NetObjectSchema = {
    x: NetType.i16,
    y: NetType.i16,
    f: NetType.i16,
    name: NetType.STRING
}