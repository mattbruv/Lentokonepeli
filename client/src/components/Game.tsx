import { forwardRef } from "react";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps {
    showScoreboard: boolean
}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    return <div ref={ref} style={{ position: "relative" }}>
        {props.showScoreboard && (
            <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />
        )}
    </div>;
});
