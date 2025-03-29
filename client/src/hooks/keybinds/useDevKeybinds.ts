import { DebugEntity } from "dogfight-types/DebugEntity";
import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { ChatMode } from "../../components/Chat";
import { useSettingsContext } from "../../contexts/settingsContext";
import { assertNever } from "../../helpers";
import { DevAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useDevKeybinds = ({ client, engine }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { globalState } = useSettingsContext();
    const { chatState } = globalState;

    const handleEvent: KeybindCallback<DevAction> = (action, type) => {
        if (chatState !== ChatMode.Passive) return;
        if (type === "down") return;
        switch (action) {
            case "debug": {
                const debugInfo: DebugEntity[] = JSON.parse(engine.debug());
                client.renderClient.renderDebug(debugInfo);
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
    }, []);
};
