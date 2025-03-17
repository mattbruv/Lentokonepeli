import { useEffect } from "react";
import { assertNever } from "../../helpers";
import { GlobalAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

type GlobalActions = {
    toggleScoreboard: (enabled: boolean) => void; //
    toggleChat: (enabled: boolean) => void;
};

export const useGlobalKeybinds = ({ toggleScoreboard, toggleChat }: GlobalActions) => {
    const handleEvent: KeybindCallback<GlobalAction> = (action, type, event) => {
        event.preventDefault();
        switch (action) {
            case "scoreboard": {
                return toggleScoreboard(type === "down");
            }
            case "chat": {
                return toggleChat(type === "down");
            }
            default:
                assertNever(action);
        }
    };

    const keybinds: KeybindConfig<GlobalAction> = {
        callback: handleEvent,
        keybinds: [
            {
                action: "chat",
                key: "y",
            },
            {
                action: "scoreboard",
                key: "tab",
            },
        ],
    };

    useEffect(() => {
        const unregisterKeybinds = registerKeybinds(keybinds);

        return unregisterKeybinds;
    }, []);
};
