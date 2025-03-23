import { DogfightWeb } from "dogfight-web";
import { useEffect } from "react";
import { DogfightClient } from "../../client/DogfightClient";
import { ChatMode } from "../../components/Chat";
import { useSettingsContext } from "../../contexts/settingsContext";
import { assertNever } from "../../helpers";
import { ChatAction, GameAction, KeybindCallback, KeybindConfig } from "./models";
import { registerKeybinds } from "./registerKeybinds";

export const useGameKeybinds = ({ client }: { client: DogfightClient; engine: DogfightWeb }) => {
    const { settings, globalState, setSettings, setGlobalState, sendChatMessage } = useSettingsContext();
    const { chatState } = globalState;

    const handleGameEvent: KeybindCallback<GameAction> = (action, type, event) => {
        if (chatState !== ChatMode.Passive) return;

        event.preventDefault();

        switch (action) {
            case "viewScoreboard": {
                const viewingScoreboard = type === "down";
                setGlobalState((prev) => ({
                    ...prev,
                    viewingScoreboard,
                }));
                break;
            }
            case "chatAll": {
                setGlobalState((prev) => ({
                    ...prev,
                    chatState: ChatMode.MessagingGlobal,
                }));
                break;
            }
            case "chatTeam": {
                setGlobalState((prev) => ({
                    ...prev,
                    chatState: ChatMode.MessagingTeam,
                }));
                break;
            }
            case "toggleMute": {
                if (type === "down") return;
                setSettings((settings) => ({
                    ...settings,
                    audioSettings: { ...settings.audioSettings, muted: !settings.audioSettings.muted },
                }));
                break;
            }
            default: {
                client.keyboard.onKeyChange(action, type);
            }
        }
    };

    const handleChatEvent: KeybindCallback<ChatAction> = (action, type, event) => {
        if (chatState === ChatMode.Passive) return;

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
        const unregisterGameKeybinds = registerKeybinds(gameKeybinds);
        const unregisterChatKeybinds = registerKeybinds(chatKeybinds);

        const unregisterKeybinds = () => {
            unregisterGameKeybinds();
            unregisterChatKeybinds();
        };

        return unregisterKeybinds;
    }, []);
};
