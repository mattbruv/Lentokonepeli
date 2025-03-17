import { Keybind, KeybindConfig } from "./models";

/**
 * Converting to lowercase to support having shift pressed at the same time
 * If there is a need to have keybinds with modifiers, they can be implemented alongside the plain keybinds
 */
const keybindToIdentifier = <T extends string>(keybind: Keybind<T>) => keybind.key.toLowerCase();

const eventToIdentifier = (e: KeyboardEvent) => e.key.toLowerCase();

export const registerKeybinds = <T extends string>(config: KeybindConfig<T>) => {
    const callbacks = new Map<string, T[]>();

    for (const keybind of config.keybinds) {
        const identifier = keybindToIdentifier(keybind);
        const keybindCallbacks = (callbacks.get(identifier) ?? []).concat(keybind.action);
        callbacks.set(identifier, keybindCallbacks);
    }

    const handleKeyEvent = (eventType: "down" | "up") => (event: KeyboardEvent) => {
        const plainKeybindIdentifier = eventToIdentifier(event);
        const plainKeybindCallbacks = callbacks.get(plainKeybindIdentifier);
        if (plainKeybindCallbacks) {
            for (const action of plainKeybindCallbacks) {
                config.callback(action, eventType, event);
            }
        }
    };

    const keyup = handleKeyEvent("up");

    const keydown = handleKeyEvent("down");

    document.addEventListener("keyup", keyup);
    document.addEventListener("keydown", keydown);

    return function unregisterCallbacks() {
        document.removeEventListener("keyup", keyup);
        document.removeEventListener("keydown", keydown);
    };
};
