import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { ChatMode } from "../../components/Chat";
import { useSettingsContext } from "../../contexts/settingsContext";
import { GameAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useGameKeybinds = ({ client }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { settings, globalState } = useSettingsContext();
    const { chatState } = globalState;
    const handleEvent: KeybindCallback<GameAction> = (action, type, event) => {
        if (chatState !== ChatMode.Passive) return;
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
    }, [client.keyboard, globalState]);
};
