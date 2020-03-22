import { Packet } from "./types";

/**
 * Takes a packet and turns it into sendable data
 * to be recieved over the wire.
 * @param info Packet to pack.
 */
// or byte array
export function pack(info: Packet): string {
  return JSON.stringify(info);
}

/**
 * Takes data sent over the network
 * and parses it into a packet object for JS use.
 * @param info network data
 */
export function unpack(info: string): Packet {
  return JSON.parse(info);
}
