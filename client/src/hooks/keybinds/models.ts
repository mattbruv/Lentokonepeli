import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";

// Different actions that can be run through keyboard input (as unions)

export type GlobalAction = "scoreboard" | "chat";
export type GameAction = keyof PlayerKeyboard;
export type DevAction = "debug";

export type Keybind<T extends string> = {
    key: string;
    action: T;
};

export type KeybindCallback<T extends string> = (action: T, type: "up" | "down", event: KeyboardEvent) => void;

export type KeybindConfig<T extends string> = {
    callback: KeybindCallback<T>;
    keybinds: Keybind<T>[];
};
