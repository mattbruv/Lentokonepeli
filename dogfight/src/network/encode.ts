import {
  Packet,
  GameObjectSchema,
  IntByteSizes,
  IntType,
  PacketType
} from "./types";
import { schemaTypes } from "./schemas";

const test: Packet = {
  type: PacketType.ChangeSync,
  data: {
    21: {
      type: 7,
      //x: 50,
      // fuel: 69,
      flipped: true
    },
    22: {
      type: 7,
      //x: 50,
      // fuel: 69,
      flipped: true
    }
  }
};

const example: Packet = {
  type: 6,
  data: {
    "21": {
      type: 7,
      x: -4441,
      fuel: 174
      // ammo: 3,
      // bombs: 10
    },
    "23": {
      type: 7,
      x: 2335
    },
    "25": {
      type: 7,
      x: 1613,
      flipped: false
      // y: -3259
    },
    "27": {
      type: 7,
      x: -282,
      fuel: 238
    },
    "29": {
      type: 7,
      x: 1017
    }
  }
};

function getGameObjectSize(data: any, schema: GameObjectSchema): number {
  const typeBytes = 1;
  const idBytes = 3;
  let dataBytes = 0;

  const propCount =
    schema.numbers.length + schema.booleans.length + schema.strings.length;
  const propBytes = Math.ceil(propCount / 8);

  schema.numbers.forEach((number): void => {
    if (data[number.name] !== undefined) {
      dataBytes += IntByteSizes[number.intType];
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
      booleanByte |= 1 << currentBool % 8;
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

  return newOffset;
}

/*

  We want to turn a list of game object updates
  into a small binary array of bytes.


*/
export function encodeCache(packet: Packet): void {
  const cache = packet.data;
  let size = 1; // packet type
  for (const id in cache) {
    const entry = cache[id];
    const type = entry.type;
    size += getGameObjectSize(entry, schemaTypes[type]);
  }
  console.log("Size:", size);
  console.log("Original:", JSON.stringify(cache).length);
  // create arraybuffer with size of info.
  let offset = 0;
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  // write type
  view.setUint8(offset, packet.type);
  offset++;
  for (const id in cache) {
    const entry = cache[id];
    const type = entry.type;
    const idNum = parseInt(id);

    // encode type and ID before data.
    const header = ((type & 0xff) << 24) | (idNum & 0xffffff);
    view.setUint32(offset, header);
    offset += 4;
    console.log(offset);

    offset = encodeGameObject(view, offset, entry, schemaTypes[type]);
  }
  console.log(buffer);
  const hex = Buffer.from(buffer).toString("hex");
  console.log(hex);
}

export function encodePacket(): void {
  encodeCache(example);
  // do something
}
