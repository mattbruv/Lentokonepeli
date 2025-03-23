import { forwardRef, useEffect, useState } from "react";
import { useSettingsContext } from "../contexts/settingsContext";
import { Chat, ChatMode, ChatProps } from "./Chat";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatProps {}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    const { setGlobalState, globalState } = useSettingsContext();
    const [isScoreboardVisible, setScoreboardVisible] = useState(false);

    const { chatState } = globalState;

    function setChatMode(value: ChatMode) {
        setGlobalState((prev) => ({
            ...prev,
            isChatOpen: value,
        }));
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            console.log("GAME CHAT KEY", chatState);

            if (key === "tab") {
                event.preventDefault(); // Prevents default browser behavior
                setScoreboardVisible(true);
            }
            if (key === "y") {
                setChatMode(ChatMode.MessagingGlobal);
            }
            if (key === "u") {
                setChatMode(ChatMode.MessagingTeam);
            }
            if (key === "escape") {
                setChatMode(ChatMode.Passive);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            if (key === "tab") {
                setScoreboardVisible(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [chatState]); // Re-runs only when `isChatOpen` changes

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {isScoreboardVisible && <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />}
            {<Chat messages={props.messages} onSendMessage={props.onSendMessage} />}
        </div>
    );
});
