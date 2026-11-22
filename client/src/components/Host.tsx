import { Button, Stack } from "@mantine/core";
import { IconFileDownload } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { useLocalHost } from "../hooks/useLocalHost";
import { LevelName } from "../views/Lobby";
import { Game } from "./Game";
import { GameStage } from "./GameStage";
import { RoomCode } from "./RoomCode";
import { Panel } from "./ui/Panel";

type HostProps = {
    level: LevelName;
    recordGame: boolean;
    gameTime: number;
};

export function Host({ level, recordGame, gameTime }: HostProps) {
    const gameContainer = useRef<HTMLDivElement>(null);
    const { getUsername, getClan } = useSettingsContext();

    const {
        getReplayBinary,
        initialize,
        roomCode,
        hostGame,
        playerData,
        intermission,
        playerGuid,
        messages,
        sendChatMessage,
    } = useLocalHost(level, recordGame, getUsername(), getClan(), gameTime);

    function host() {
        if (!gameContainer.current) return;
        initialize(gameContainer.current);
        hostGame();
    }

    function saveReplay(): void {
        const replayBytes = getReplayBinary();
        if (!replayBytes) return;

        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        const filename = level + "_" + roomCode + "_" + formattedDate + ".lento";
        saveAs(new Blob([replayBytes]), filename);
    }

    useEffect(() => {
        host();
    }, []);

    return (
        <GameStage
            game={
                <Game
                    ref={gameContainer}
                    myPlayerGuid={playerGuid}
                    playerData={playerData}
                    intermission={intermission}
                    roomName={roomCode}
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
                    <Stack gap="lg">
                        <RoomCode code={roomCode} />
                        <Button
                            onClick={saveReplay}
                            color="copper"
                            fullWidth
                            rightSection={<IconFileDownload stroke={2.4} />}
                        >
                            <FormattedMessage
                                defaultMessage={"Save Replay File"}
                                description={"Button text for button which saves replay file"}
                            />
                        </Button>
                    </Stack>
                </Panel>
            }
        />
    );
}
