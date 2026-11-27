import { Button, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFileDownload, IconSettings } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { getCustomLevels, resolveLevel } from "../customLevels";
import { useActiveView } from "../hooks/useActiveView";
import { InitialBots, useLocalHost } from "../hooks/useLocalHost";
import { Game } from "./Game";
import { GameSettings } from "./GameSettingsFields";
import { GameStage } from "./GameStage";
import { HostMenu } from "./HostMenu";
import classes from "./HostMenu.module.css";
import { RoomCode } from "./RoomCode";
import { Panel } from "./ui/Panel";

type HostProps = {
    settings: GameSettings;
    recordGame: boolean;
    lobbyName: string;
    initialBots: InitialBots;
};

export function Host({ settings, recordGame, lobbyName, initialBots }: HostProps) {
    const gameContainer = useRef<HTMLDivElement>(null);
    const { getUsername, getClan } = useSettingsContext();
    const [menuOpened, menu] = useDisclosure();

    const host = useLocalHost(
        {
            level: resolveLevel(settings.levelKey, getCustomLevels()),
            gameTime: settings.gameTime,
            gameMode: settings.gameMode,
        },
        recordGame,
        getUsername(),
        getClan(),
        lobbyName,
        initialBots,
    );

    function changeGame(next: GameSettings) {
        host.changeGame({
            level: resolveLevel(next.levelKey, getCustomLevels()),
            gameTime: next.gameTime,
            gameMode: next.gameMode,
        });
    }

    function start() {
        if (!gameContainer.current) return;
        host.initialize(gameContainer.current);
        host.hostGame();
    }

    function saveReplay(): void {
        const replayBytes = host.getReplayBinary();
        if (!replayBytes) return;

        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        const filename = host.gameSettings.level.name + "_" + host.roomCode + "_" + formattedDate + ".lento";
        saveAs(new Blob([replayBytes]), filename);
    }

    useActiveView("game");

    useEffect(() => {
        start();
    }, []);

    return (
        <>
            <HostMenu
                opened={menuOpened}
                onClose={menu.close}
                lobbyName={host.lobbyName}
                onLobbyNameChange={host.setLobbyName}
                worldState={host.worldState}
                onEndRound={host.endRound}
                gameSettings={{
                    levelKey: host.gameSettings.level.key,
                    gameTime: host.gameSettings.gameTime,
                    gameMode: host.gameSettings.gameMode,
                }}
                onChangeGame={changeGame}
                hostGuid={host.hostGuid}
                playerData={host.playerData}
                onKickPlayer={host.kickPlayer}
                bots={host.bots}
                onAddBots={host.addBots}
                onRemoveBots={host.removeBots}
            />
            <GameStage
                game={
                    <Game
                        ref={gameContainer}
                        myPlayerGuid={host.playerGuid}
                        playerData={host.playerData}
                        intermission={host.intermission}
                        roomName={host.lobbyName || host.roomCode}
                        messages={host.messages}
                        onSendMessage={host.sendChatMessage}
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
                            {host.lobbyName && <div className={classes.lobbyName}>{host.lobbyName}</div>}
                            <RoomCode code={host.roomCode} />
                            <Button
                                onClick={saveReplay}
                                color="grass"
                                fullWidth
                                rightSection={<IconFileDownload stroke={2.4} />}
                            >
                                <FormattedMessage
                                    defaultMessage={"Save Replay File"}
                                    description={"Button text for button which saves replay file"}
                                />
                            </Button>
                            <Button
                                onClick={menu.open}
                                color="copper"
                                fullWidth
                                rightSection={<IconSettings stroke={2.4} />}
                            >
                                <FormattedMessage
                                    defaultMessage="Host menu"
                                    description="Button that opens the host game management dialog"
                                />
                            </Button>
                        </Stack>
                    </Panel>
                }
            />
        </>
    );
}
