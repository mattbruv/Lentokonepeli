import { Packet, GameObjectSchema } from "./types";
import { SchemaPlane } from "./schemas";

const exampleUpdatePacket: Packet = {
  type: 6,
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

function getObjectByteSize(data: any, schema: GameObjectSchema): number {
  console.log(data);
  console.log(schema);

  return 0;
}

/*

  We want to turn a list of game object updates
  into a small binary array of bytes.


*/
export function encodeCache(): void {
  console.log("okay");

  const a = new Uint8Array();
  console.log(a);

  /*
  const cache = exampleUpdatePacket.data;
  let size = 0;
  for (const id in cache) {
    const entry = cache[id];
    const bytes = getObjectByteSize(entry, SchemaPlane);
  }
  console.log("Size:", size);
  */
}
