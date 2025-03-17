import { forwardRef } from "react";
import { Chat, ChatProps } from "./Chat";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatProps {
    showScoreboard: boolean;
    showChat: boolean;
}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    return (
        <div ref={ref} style={{ position: "relative" }}>
            {props.showScoreboard && <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />}
            {props.showChat && <Chat />}
        </div>
    );
});
