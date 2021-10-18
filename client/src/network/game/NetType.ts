export const enum NetType {
    u8, // Unsigned Byte
    i8, // Signed Byte
    u16, // Unsigned Short
    i16, // Signed Short
    u32, // Unsigned int
    i32, // Signed int
    STRING, // UTF-8 String
    BOOL, // boolean value
}

export const enum NetPacket {
    GAME_STATE, // full state sent on connection/game state update
    USER_INPUT
}