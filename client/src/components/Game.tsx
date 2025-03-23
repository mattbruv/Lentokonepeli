import { forwardRef } from "react";
import { useSettingsContext } from "../contexts/settingsContext";
import { Chat, ChatProps } from "./Chat";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

interface GameProps extends ScoreboardProps, ChatProps {}

export const Game = forwardRef<HTMLDivElement, GameProps>((props, ref) => {
    const { globalState } = useSettingsContext();

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {globalState.viewingScoreboard && (
                <Scoreboard playerData={props.playerData} myPlayerGuid={props.myPlayerGuid} />
            )}
            {<Chat messages={props.messages} onSendMessage={props.onSendMessage} />}
        </div>
    );
});
