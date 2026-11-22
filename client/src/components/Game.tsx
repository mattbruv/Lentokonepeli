import { forwardRef } from "react";
import { useSettingsContext } from "../contexts/settingsContext";
import { Chat, ChatGlobalProps } from "./Chat";
import "./Game.css";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatGlobalProps {}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    const { globalState } = useSettingsContext();

    const myTeam = props.playerData.find((x) => x.guid === props.myPlayerGuid)?.team ?? null;

    return (
        <div ref={ref} className="lk-game">
            {(globalState.viewingScoreboard || props.intermission) && (
                <Scoreboard
                    playerData={props.playerData}
                    myPlayerGuid={props.myPlayerGuid}
                    intermission={props.intermission}
                    roomName={props.roomName}
                />
            )}
            {<Chat messages={props.messages} onSendMessage={props.onSendMessage} myTeam={myTeam} />}
        </div>
    );
});
