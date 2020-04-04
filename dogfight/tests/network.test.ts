import { Packet, PacketType } from "../src/network/types";
import { encodePacket, decodePacket } from "../src/network/encode";
import { GameObjectType } from "../src/object";

/*
  Old style: Raw JSON, 167 bytes
  only changing a few properties on 5 planes.
*/
export const packet1: Packet = {
  type: PacketType.ChangeSync,
  data: {
    "21": {
      type: 7,
      x: -4441,
      fuel: 174
    },
    "23": {
      type: 7,
      x: 2335
    },
    "25": {
      type: 7,
      x: 1613
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

test("can encode/decode example packet", (): void => {
  const decoded = decodePacket(encodePacket(packet1));
  expect(decoded).toEqual(packet1);
});

test("can encode/decode int16 range", (): void => {
  for (let i = -32768; i < 32767; i++) {
    const example: Packet = {
      type: PacketType.ChangeSync,
      data: {
        0: {
          type: GameObjectType.Plane,
          x: i
        }
      }
    };
    const decoded = decodePacket(encodePacket(example));
    expect(decoded).toEqual(example);
  }
});
