import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { ChatMode } from "../../components/Chat";
import { useSettingsContext } from "../../contexts/settingsContext";
import { ChatAction, GameAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useGameKeybinds = ({ client }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { settings, globalState, setGlobalState } = useSettingsContext();
    const { chatState } = globalState;

    const handleGameEvent: KeybindCallback<GameAction> = (action, type, event) => {
        console.log("GAME EVENT HANDLER");
        event.preventDefault();
        client.keyboard.onKeyChange(action, type);

        // global chat
        if (event.key == "y") {
            setGlobalState((prev) => ({
                ...prev,
                chatState: ChatMode.MessagingGlobal,
            }));
        }
    };

    const handleChatEvent: KeybindCallback<ChatAction> = (action, type, event) => {
        event.preventDefault();

        if (action === "close") {
            setGlobalState((prev) => ({
                ...prev,
                chatState: ChatMode.Passive,
            }));
        }
    };

    const gameKeybinds: KeybindConfig<GameAction> = {
        callback: handleGameEvent,
        keybinds: settings.controls,
    };

    const chatKeybinds: KeybindConfig<ChatAction> = {
        callback: handleChatEvent,
        keybinds: [
            {
                action: "close",
                key: "Escape",
            },
        ],
    };

    useEffect(() => {
        let unregisterKeybinds: () => void;

        if (chatState === ChatMode.Passive) {
            unregisterKeybinds = registerKeybinds(gameKeybinds);
        } else {
            unregisterKeybinds = registerKeybinds(chatKeybinds);
        }
        console.log("registered keybinds for ", ChatMode[chatState]);

        return unregisterKeybinds;
    }, [client.keyboard, globalState]);
};
