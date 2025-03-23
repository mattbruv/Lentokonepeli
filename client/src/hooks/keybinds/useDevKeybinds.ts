import { DebugEntity } from "dogfight-types/DebugEntity";
import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { useSettingsContext } from "../../contexts/settingsContext";
import { assertNever } from "../../helpers";
import { DevAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useDevKeybinds = ({ client, engine }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { globalState } = useSettingsContext();
    const handleEvent: KeybindCallback<DevAction> = (action, type) => {
        if (globalState.isChatOpen) return;
        if (type === "down") return;
        switch (action) {
            case "debug": {
                const debugInfo: DebugEntity[] = JSON.parse(engine.debug());
                client.renderDebug(debugInfo);
                return;
            }
            default:
                assertNever(action);
        }
    };

    const keybinds: KeybindConfig<DevAction> = {
        callback: handleEvent,
        keybinds: [
            {
                key: "d",
                action: "debug",
            },
        ],
    };

    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const unregisterKeybinds = registerKeybinds(keybinds);
        return unregisterKeybinds;
    }, [globalState]);
};
