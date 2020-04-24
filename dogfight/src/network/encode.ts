import {
  Packet,
  GameObjectSchema,
  IntByteSizes,
  IntType,
  PacketType
} from "./types";
import { schemaTypes } from "./schemas";
import { InputChange } from "../input";

function getGameObjectSize(data: any, schema: GameObjectSchema): number {
  const typeBytes = 1;
  const idBytes = 2;
  let dataBytes = 0;

  const propCount =
    schema.numbers.length + schema.booleans.length + schema.strings.length;
  const propBytes = Math.ceil(propCount / 8);

  schema.numbers.forEach((number): void => {
    if (data[number.name] !== undefined) {
      dataBytes += IntByteSizes[number.intType];
    }
  });

  schema.strings.forEach((str): void => {
    if (data[str] !== undefined) {
      const encoder = new TextEncoder();
      const view = encoder.encode(data[str]);
      // 1 for size of string, rest is string length
      const strBytes = 1 + view.byteLength;
      dataBytes += strBytes;
    }
  });

  let setBools = 0;
  schema.booleans.forEach((bool): void => {
    if (data[bool] !== undefined) {
      setBools += 1;
    }
  });

  const boolBytes = Math.ceil(setBools / 8);
  dataBytes += boolBytes;

  return typeBytes + idBytes + propBytes + dataBytes;
}

function encodeNumber(
  view: DataView,
  offset: number,
  value: number,
  type: IntType
): number {
  switch (type) {
    case IntType.Uint8:
      view.setUint8(offset, value);
      break;
    case IntType.Int8:
      view.setInt8(offset, value);
      break;
    case IntType.Uint16:
      view.setUint16(offset, value);
      break;
    case IntType.Int16:
      view.setInt16(offset, value);
      break;
  }
  const val = IntByteSizes[type];
  return val;
}

function decodeNumber(view: DataView, offset: number, type: IntType): number {
  let value = 0;
  switch (type) {
    case IntType.Uint8:
      value = view.getUint8(offset);
      break;
    case IntType.Int8:
      value = view.getInt8(offset);
      break;
    case IntType.Uint16:
      value = view.getUint16(offset);
      break;
    case IntType.Int16:
      value = view.getInt16(offset);
      break;
  }
  return value;
}

function encodeGameObject(
  view: DataView,
  offset: number,
  data: any,
  schema: GameObjectSchema
): number {
  const propCount =
    schema.numbers.length + schema.booleans.length + schema.strings.length;
  const propBytes = Math.ceil(propCount / 8);
  let newOffset = offset + propBytes;
  let propertyByteOffset = offset;
  let currentProperty = 0;
  let propertyByte = 0;

  // Write each number
  schema.numbers.forEach((number): void => {
    if (data[number.name] !== undefined) {
      // this is set, so set it's property bit.
      propertyByte |= 1 << currentProperty % 8;
      // write property byte
      view.setUint8(propertyByteOffset, propertyByte);
      // write our actual value
      newOffset += encodeNumber(
        view,
        newOffset,
        data[number.name],
        number.intType
      );
    }
    // Increment which property we're on.
    currentProperty++;
    if (currentProperty % 8 == 0) {
      propertyByteOffset++;
      propertyByte = 0;
    }
  });

  let totalBools = 0;
  let booleanByte = 0;
  let currentBool = 0;
  let booleanOffset = newOffset;

  // Write each boolean
  schema.booleans.forEach((bool): void => {
    if (data[bool] !== undefined) {
      // this is set, so set it's property bit.
      propertyByte |= 1 << currentProperty % 8;
      // write property byte
      view.setUint8(propertyByteOffset, propertyByte);
      // encode our boolean value
      const value = data[bool] == true ? 1 : 0;
      booleanByte |= value << currentBool % 8;
      view.setUint8(booleanOffset, booleanByte);
      totalBools++;
    }
    // Increment which property we're on.
    currentProperty++;
    if (currentProperty % 8 == 0) {
      propertyByteOffset++;
      propertyByte = 0;
    }
    // increment bool
    currentBool++;
    if (currentBool % 8 == 0) {
      booleanOffset++;
      booleanByte = 0;
    }
  });
  newOffset += Math.ceil(totalBools / 8);

  // Write each string
  schema.strings.forEach((str): void => {
    // do something
    if (data[str] !== undefined) {
      // this is set, so set it's property bit.
      propertyByte |= 1 << currentProperty % 8;
      // write property byte
      view.setUint8(propertyByteOffset, propertyByte);
      const encoder = new TextEncoder();
      const strView = encoder.encode(data[str]);
      // write header size
      view.setUint8(newOffset++, strView.byteLength);
      strView.forEach((byte): void => {
        // write the bytes to view
        view.setUint8(newOffset++, byte);
      });
    }
    // Increment which property we're on.
    currentProperty++;
    if (currentProperty % 8 == 0) {
      propertyByteOffset++;
      propertyByte = 0;
    }
  });

  return newOffset;
}

/*

  We want to turn a list of game object updates
  into a small binary array of bytes.


*/
export function encodeCache(packet: Packet): ArrayBuffer {
  const cache = packet.data;
  let size = 1; // packet type
  for (const type in cache) {
    for (const id in cache[type]) {
      const entry = cache[type][id];
      size += getGameObjectSize(entry, schemaTypes[type]);
    }
  }
  // create arraybuffer with size of info.
  let offset = 0;
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  // write type
  view.setUint8(offset, packet.type);
  offset++;
  for (const type in cache) {
    for (const id in cache[type]) {
      const entry = cache[type][id];
      const idNum = parseInt(id);
      const t = parseInt(type);

      // encode type and ID before data.
      view.setUint8(offset++, t);
      view.setUint16(offset, idNum);
      // const header = ((t & 0xff) << 24) | (idNum & 0xffffff);
      // view.setUint32(offset, header);
      offset += 2;
      offset = encodeGameObject(view, offset, entry, schemaTypes[t]);
    }
  }
  return buffer;
}

export function decodeCache(buffer: ArrayBuffer): Packet {
  let currentOffset = 0;
  const view = new DataView(buffer);
  const packetType = view.getUint8(currentOffset++);
  const packet: Packet = {
    type: packetType,
    data: {}
  };
  const maxOffset = view.byteLength;
  while (currentOffset < maxOffset) {
    /*
    const typeandid = view.getUint32(currentOffset);
    const type = (typeandid >> 24) & 0xff;
    const id = typeandid & 0xffffff;
    */
    const type = view.getUint8(currentOffset++);
    const id = view.getUint16(currentOffset);
    currentOffset += 2;

    if (packet.data[type] == undefined) {
      packet.data[type] = {};
    }
    packet.data[type][id] = {
      type: type
    };

    const schema: GameObjectSchema = schemaTypes[type];
    // destructure the binary according to the schema
    const propCount =
      schema.numbers.length + schema.booleans.length + schema.strings.length;
    const propBytes = Math.ceil(propCount / 8);

    let currentProperty = 0;
    let propertyByteOffset = currentOffset;
    let propertyByte = view.getUint8(propertyByteOffset);

    currentOffset += propBytes;

    schema.numbers.forEach((number): void => {
      // determine if this property is set.
      const index = currentProperty % 8;
      const isSet: boolean = ((propertyByte >> index) & 1) == 1;
      if (isSet) {
        // read the number, ya dingus
        const value = decodeNumber(view, currentOffset, number.intType);
        packet.data[type][id][number.name] = value;
        currentOffset += IntByteSizes[number.intType];
      }
      // go to next property
      currentProperty++;
      if (currentProperty % 8 == 0) {
        propertyByteOffset++;
        propertyByte = view.getUint8(propertyByteOffset);
      }
    });

    if (currentOffset >= maxOffset) {
      break;
    }

    let totalBools = 0;
    let booleanCounter = 0;
    let booleanOffset = currentOffset;
    let booleanByte = view.getUint8(booleanOffset);

    // now do booleans
    schema.booleans.forEach((bool): void => {
      const index = currentProperty % 8;
      const isSet: boolean = ((propertyByte >> index) & 1) == 1;
      if (isSet) {
        const boolIndex = booleanCounter % 8;
        const value = ((booleanByte >> boolIndex) & 1) == 1;
        packet.data[type][id][bool] = value;
        totalBools++;
      }
      currentProperty++;
      if (currentProperty % 8 == 0) {
        propertyByteOffset++;
        propertyByte = view.getUint8(propertyByteOffset);
      }
      booleanCounter++;
      if (booleanCounter % 8 == 0) {
        booleanOffset++;
        booleanByte = view.getUint8(booleanOffset);
      }
    });

    currentOffset += Math.ceil(totalBools / 8);

    // decode strings
    schema.strings.forEach((str): void => {
      const index = currentProperty % 8;
      const isSet: boolean = ((propertyByte >> index) & 1) == 1;
      if (isSet) {
        // get length of string
        const length = view.getUint8(currentOffset++);
        const decoder = new TextDecoder();
        const strBytes = [];
        for (let i = 0; i < length; i++) {
          // get each byte
          strBytes.push(view.getUint8(currentOffset++));
        }
        const strValue = decoder.decode(new Uint8Array(strBytes));
        packet.data[type][id][str] = strValue;
      }
      currentProperty++;
      if (currentProperty % 8 == 0) {
        propertyByteOffset++;
        propertyByte = view.getUint8(propertyByteOffset);
      }
    });
  }
  return packet;
}

function encodeInput(packet: Packet): ArrayBuffer {
  const change: InputChange = packet.data;
  const buffer = new ArrayBuffer(3);
  const view = new DataView(buffer);
  view.setUint8(0, packet.type);
  view.setUint8(1, change.key);
  view.setUint8(2, change.isPressed ? 1 : 0);
  return buffer;
}

function decodeInput(buffer: ArrayBuffer): Packet {
  const view = new DataView(buffer);
  const type = view.getUint8(0);
  const key = view.getUint8(1);
  const isPressed = view.getUint8(2) == 1;
  const data: InputChange = { key, isPressed };
  return { type, data };
}

export function encodePacket(packet: Packet): string | ArrayBuffer {
  switch (packet.type) {
    case PacketType.FullSync:
    case PacketType.ChangeSync: {
      return encodeCache(packet);
    }
    case PacketType.UserGameInput: {
      return encodeInput(packet);
    }
    default: {
      return JSON.stringify(packet);
    }
  }
}

export function decodePacket(data: string | ArrayBuffer): Packet {
  if (typeof data == "string") {
    const packet = JSON.parse(data);
    return packet;
  } else {
    const view = new DataView(data);
    const type: PacketType = view.getUint8(0);
    switch (type) {
      case PacketType.ChangeSync:
      case PacketType.FullSync: {
        return decodeCache(data);
      }
      case PacketType.UserGameInput: {
        return decodeInput(data);
      }
    }
  }
}
