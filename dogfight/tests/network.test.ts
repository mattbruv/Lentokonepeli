import { Packet } from "../src/network/types";

/*
  Old style: Raw JSON, 167 bytes
  only changing a few properties on 5 planes.
*/
export const exampleUpdatePacket: Packet = {
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
