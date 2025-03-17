import { DebugEntity } from "dogfight-types/DebugEntity";
import { registerKeybinds } from "./registerKeybinds";
import { DogfightWeb } from "dogfight-web";
import { DogfightClient } from "../../client/DogfightClient";
import { useEffect } from "react";
import { DevAction, KeybindCallback, KeybindConfig } from "./models";
import { assertNever } from "../../helpers";

export const useDevKeybinds = ({ client, engine }: { client: DogfightClient; engine: DogfightWeb }) => {
    const handleEvent: KeybindCallback<DevAction> = (action, type) => {
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
    }, []);
};
