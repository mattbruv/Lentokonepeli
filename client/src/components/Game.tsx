import { forwardRef, useEffect, useState } from "react";
import { Chat, ChatProps } from "./Chat";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatProps {}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    const [isScoreboardVisible, setScoreboardVisible] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            if (key === "tab") {
                event.preventDefault(); // Prevents default browser behavior
                setScoreboardVisible(true);
            }
            if ((key === "y" || key === "u") && !isChatOpen) {
                setChatOpen(true);
            }
            if (key === "escape") {
                setChatOpen(false);
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
    }, [isChatOpen]); // Re-runs only when `isChatOpen` changes

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {isScoreboardVisible && <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />}
            {isChatOpen && <Chat messages={props.messages} />}
        </div>
    );
});
