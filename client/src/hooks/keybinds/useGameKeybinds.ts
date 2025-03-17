import { registerKeybinds } from "./registerKeybinds";
import { useEffect } from "react";
import { DogfightWeb } from "dogfight-web";
import { DogfightClient } from "../../client/DogfightClient";
import { useSettingsContext } from "../../contexts/settingsContext";
import { GameAction, KeybindCallback, KeybindConfig } from "./models";

export const useGameKeybinds = ({ client }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { settings } = useSettingsContext();

    const handleEvent: KeybindCallback<GameAction> = (action, type, event) => {
        event.preventDefault();
        client.keyboard.onKeyChange(action, type);
    };

    const keybinds: KeybindConfig<GameAction> = {
        callback: handleEvent,
        keybinds: settings.controls,
    };

    useEffect(() => {
        const unregisterKeybinds = registerKeybinds(keybinds);

        return unregisterKeybinds;
    }, [client.keyboard]);
};
