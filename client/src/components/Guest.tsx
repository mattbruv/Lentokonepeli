import { Button, Stack } from "@mantine/core";
import { IconFileDownload } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { leaveActiveGame, useActiveView } from "../hooks/useActiveView";
import { ReplayDownload, useGuest } from "../hooks/useGuest";
import { ConnectionOverlay } from "./ConnectionOverlay";
import { Game } from "./Game";
import { GameStage } from "./GameStage";
import { RoomCode } from "./RoomCode";
import { Panel } from "./ui/Panel";
import classes from "./HostMenu.module.css";

type GuestProps = {
    gameCode: string;
};

export function Guest({ gameCode }: GuestProps) {
    const [attempt, setAttempt] = useState(0);
    return <GuestSession key={attempt} gameCode={gameCode} onRetry={() => setAttempt((n) => n + 1)} />;
}

function GuestSession({ gameCode, onRetry }: GuestProps & { onRetry: () => void }) {
    const gameContainer = useRef<HTMLDivElement>(null);

    const { getClan, getUsername } = useSettingsContext();

    const {
        initialize,
        joinGame,
        status,
        playerData,
        intermission,
        playerGuid,
        messages,
        sendChatMessage,
        requestReplay,
        replayDownload,
        lobbyName,
    } = useGuest(getUsername(), getClan());

    function downloadReplay() {
        requestReplay((bytes) => {
            const formattedDate = new Date().toISOString().split("T")[0];
            saveAs(new Blob([bytes]), gameCode + "_" + formattedDate + ".lento");
        });
    }

    function join() {
        if (!gameContainer.current) return;
        initialize(gameContainer.current);
        joinGame(gameCode);
    }

    function leave() {
        leaveActiveGame();
        window.location.href = import.meta.env.BASE_URL;
    }

    useActiveView("game");

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
                    roomName={lobbyName || gameCode}
                    messages={messages}
                    onSendMessage={sendChatMessage}
                    overlay={
                        <ConnectionOverlay status={status} gameCode={gameCode} onRetry={onRetry} onLeave={leave} />
                    }
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
                        {lobbyName && <div className={classes.lobbyName}>{lobbyName}</div>}
                        <RoomCode code={gameCode} />
                        <Button
                            onClick={downloadReplay}
                            disabled={status.phase !== "ready" || replayDownload.phase !== "idle"}
                            color="copper"
                            fullWidth
                            rightSection={<IconFileDownload stroke={2.4} />}
                        >
                            <ReplayButtonLabel download={replayDownload} />
                        </Button>
                    </Stack>
                </Panel>
            }
        />
    );
}

function ReplayButtonLabel({ download }: { download: ReplayDownload }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (download.phase !== "cooldown") return;
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [download]);

    if (download.phase === "requesting") {
        return (
            <FormattedMessage
                defaultMessage={"Requesting Replay..."}
                description={"Button text while waiting for the host to start sending the replay file"}
            />
        );
    }

    if (download.phase === "downloading") {
        return (
            <FormattedMessage
                defaultMessage={"Downloading Replay {percent}%"}
                description={"Button text while the replay file is downloading from the host"}
                values={{ percent: Math.floor(download.progress * 100) }}
            />
        );
    }

    if (download.phase === "cooldown") {
        return (
            <FormattedMessage
                defaultMessage={"Download Replay ({seconds}s)"}
                description={"Button text while the replay download is on cooldown"}
                values={{ seconds: Math.max(0, Math.ceil((download.until - now) / 1000)) }}
            />
        );
    }

    return (
        <FormattedMessage
            defaultMessage={"Download Replay File"}
            description={"Button text for button which downloads the replay file from the host"}
        />
    );
}
