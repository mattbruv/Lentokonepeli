import { useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { useGuest } from "../hooks/useGuest";
import { Game } from "./Game";
import { GameStage } from "./GameStage";
import { RoomCode } from "./RoomCode";
import { Panel } from "./ui/Panel";

type GuestProps = {
    gameCode: string;
};

export function Guest({ gameCode }: GuestProps) {
    const gameContainer = useRef<HTMLDivElement>(null);

    const { getClan, getUsername } = useSettingsContext();

    const { initialize, joinGame, playerData, intermission, playerGuid, messages, sendChatMessage } = useGuest(
        getUsername(),
        getClan(),
    );

    function join() {
        if (!gameContainer.current) return;
        initialize(gameContainer.current);
        joinGame(gameCode);
    }

    useEffect(() => {
        join();
    }, []);

    return (
        <GameStage
            game={
                <Game
                    ref={gameContainer}
                    myPlayerGuid={playerGuid}
                    playerData={playerData}
                    intermission={intermission}
                    roomName={gameCode}
                    messages={messages}
                    onSendMessage={sendChatMessage}
                />
            }
            side={
                <Panel
                    title={
                        <FormattedMessage
                            defaultMessage={"Game Code"}
                            description={"Title shown above the shareable room code"}
                        />
                    }
                >
                    <RoomCode code={gameCode} />
                </Panel>
            }
        />
    );
}
