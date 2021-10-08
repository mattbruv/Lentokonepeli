import { NetType } from "./NetType";
import { getSchema, NetObjectSchema } from "./Schemas";


export interface EntityState {
    id: number;
    type: number;
    data: NetObjectSchema;
}

type NetData = {
    bytes: number,
    data: any
}

function getProperty(view: DataView, offset: number, type: NetType): NetData {
    const result: NetData = {
        bytes: 0,
        data: undefined
    }

    switch (type) {
        case NetType.BOOL:
            result.data = view.getUint8(offset) != 0;
            result.bytes = 1;
            break;
        case NetType.u8:
            result.data = view.getUint8(offset);
            result.bytes = 1;
            break;
        case NetType.i8:
            result.data = view.getInt8(offset);
            result.bytes = 1;
            break;
        case NetType.u16:
            result.data = view.getUint16(offset);
            result.bytes = 2;
            break;
        case NetType.i16:
            result.data = view.getInt16(offset);
            result.bytes = 2;
            break;
        case NetType.u32:
            result.data = view.getUint32(offset);
            result.bytes = 4;
            break;
        case NetType.i32:
            result.data = view.getInt32(offset);
            result.bytes = 4;
            break;
        case NetType.STRING:
            const numBytes = view.getUint16(offset);
            const decoder = new TextDecoder();
            const start = offset + 2;
            const slice = view.buffer.slice(start, start + numBytes);
            result.data = decoder.decode(slice);
            result.bytes = numBytes + 2;
    }

    return result;
}

export function readBinaryPacket(buffer: ArrayBuffer): EntityState[] {
    let index = 0;
    const view = new DataView(buffer);
    const state: EntityState[] = [];

    while (index < buffer.byteLength) {

        const entityState: EntityState = {
            id: 0,
            type: 0,
            data: {}
        }

        const id = view.getUint16(index);
        entityState.id = id;
        index += 2;

        const type = view.getUint8(index);
        entityState.type = type;
        index++;

        const schema = getSchema(type);
        const keys = Object.keys(schema);
        const numProps = keys.length;
        const numPropBytes = Math.ceil(numProps / 8);
        const propStart = index;

        // advance index to after props
        index += numPropBytes;

        for (let byteIndex = 0; byteIndex < numPropBytes; byteIndex++) {
            const propByte = view.getUint8(propStart + byteIndex);

            for (let i = 0; i < 8; i++) {
                const isSet = propByte & (1 << i);
                if (isSet) {
                    const propKey = keys[(byteIndex * 8) + i];
                    const propType = schema[propKey];
                    const prop = getProperty(view, index, propType);
                    entityState.data[propKey] = prop.data;
                    index += prop.bytes;
                    //console.log(index, buffer.byteLength)
                }
            }
        }

        state.push(entityState);
        // console.log(state);
    }

    return state;

}