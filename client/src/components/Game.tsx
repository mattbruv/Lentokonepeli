import { forwardRef, useState } from "react";
import { Chat, ChatProps } from "./Chat";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatProps {}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    const [isScoreboardVisible, setScoreboardVisible] = useState(false);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {isScoreboardVisible && <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />}
            {<Chat messages={props.messages} onSendMessage={props.onSendMessage} />}
        </div>
    );
});
