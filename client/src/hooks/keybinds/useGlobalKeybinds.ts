import { assertNever } from "../../helpers";
import { GlobalAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";
import { useEffect } from "react";

export const useGlobalKeybinds = ({ toggleScoreboard }: { toggleScoreboard: (enabled: boolean) => void }) => {
    const handleEvent: KeybindCallback<GlobalAction> = (action, type, event) => {
        event.preventDefault();
        switch (action) {
            case "scoreboard": {
                return toggleScoreboard(type === "down");
            }
            default:
                assertNever(action);
        }
    };

    const keybinds: KeybindConfig<GlobalAction> = {
        callback: handleEvent,
        keybinds: [
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
