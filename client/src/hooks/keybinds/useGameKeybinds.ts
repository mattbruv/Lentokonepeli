import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { ChatMode } from "../../components/Chat";
import { useSettingsContext } from "../../contexts/settingsContext";
import { assertNever } from "../../helpers";
import { ChatAction, GameAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useGameKeybinds = ({ client }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { settings, globalState, setGlobalState, sendChatMessage } = useSettingsContext();
    const { chatState } = globalState;

    const handleGameEvent: KeybindCallback<GameAction> = (action, type, event) => {
        event.preventDefault();
        client.keyboard.onKeyChange(action, type);

        if (action === "viewScoreboard") {
            const viewingScoreboard = type === "down";
            setGlobalState((prev) => ({
                ...prev,
                viewingScoreboard,
            }));
        }

        if (action === "chatAll") {
            setGlobalState((prev) => ({
                ...prev,
                chatState: ChatMode.MessagingGlobal,
            }));
        }
        if (action === "chatTeam") {
            setGlobalState((prev) => ({
                ...prev,
                chatState: ChatMode.MessagingTeam,
            }));
        }
    };

    const handleChatEvent: KeybindCallback<ChatAction> = (action, type, event) => {
        event.preventDefault();

        switch (action) {
            case "close": {
                setGlobalState((prev) => ({
                    ...prev,
                    chatState: ChatMode.Passive,
                }));
                break;
            }
            case "send": {
                if (sendChatMessage.current) {
                    sendChatMessage.current();
                }
                break;
            }
            default: {
                assertNever(action);
            }
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
            {
                action: "send",
                key: "Enter",
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
    }, [client.keyboard, globalState, sendChatMessage, sendChatMessage.current]);
};
