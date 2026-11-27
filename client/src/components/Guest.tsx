import { Alert, Button, Modal, ScrollArea, Select, Stack, Text } from "@mantine/core";
import { IconAdjustments, IconEye, IconFileDownload } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { leaveActiveGame, useActiveView } from "../hooks/useActiveView";
import { ReplayDownload, useGuest } from "../hooks/useGuest";
import { isDefaultRules } from "../rules";
import { ConnectionOverlay } from "./ConnectionOverlay";
import { RuleChangesList } from "./RulesEditor";
import { Game } from "./Game";
import { GameStage } from "./GameStage";
import { RoomCode } from "./RoomCode";
import { Panel } from "./ui/Panel";
import classes from "./HostMenu.module.css";

type GuestProps = {
    gameCode: string;
    spectator?: boolean;
};

export function Guest({ gameCode, spectator = false }: GuestProps) {
    const [attempt, setAttempt] = useState(0);
    return (
        <GuestSession
            key={attempt}
            gameCode={gameCode}
            spectator={spectator}
            onRetry={() => setAttempt((n) => n + 1)}
        />
    );
}

function GuestSession({ gameCode, spectator = false, onRetry }: GuestProps & { onRetry: () => void }) {
    const intl = useIntl();
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
        rules,
        spectating,
        followPlayer,
        followablePlayers,
    } = useGuest(getUsername(), getClan(), spectator);

    const customRules = useMemo(() => (rules && !isDefaultRules(rules) ? rules : null), [rules]);
    const rulesKey = customRules ? JSON.stringify(customRules) : null;
    const [acknowledgedRules, setAcknowledgedRules] = useState<string | null>(null);
    const showRulesWarning = rulesKey !== null && rulesKey !== acknowledgedRules && status.phase === "ready";

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
        <>
            <Modal
                opened={showRulesWarning}
                onClose={() => setAcknowledgedRules(rulesKey)}
                centered
                title={intl.formatMessage({
                    defaultMessage: "This game uses custom rules",
                    description: "Title of the dialog warning a joining player that the host changed the game rules",
                })}
            >
                <Stack gap="md">
                    <Text size="sm">
                        <FormattedMessage
                            defaultMessage="The host has changed these rules from the original game:"
                            description="Text above the list of game rules the host has changed"
                        />
                    </Text>
                    {customRules && (
                        <ScrollArea.Autosize mah={320} type="auto" scrollbars="y" offsetScrollbars>
                            <RuleChangesList rules={customRules} />
                        </ScrollArea.Autosize>
                    )}
                    <Button color="copper" onClick={() => setAcknowledgedRules(rulesKey)}>
                        <FormattedMessage
                            defaultMessage="Got it"
                            description="Button that closes the custom game rules warning"
                        />
                    </Button>
                </Stack>
            </Modal>
            <GameStage
                game={
                    <Game
                        ref={gameContainer}
                        myPlayerGuid={spectator ? null : playerGuid}
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
                            {customRules && (
                                <Alert
                                    color="yellow"
                                    variant="light"
                                    icon={<IconAdjustments size={20} />}
                                    title={intl.formatMessage({
                                        defaultMessage: "Custom game rules",
                                        description:
                                            "Title of the notice in the game sidebar listing the rules the host changed",
                                    })}
                                >
                                    <ScrollArea.Autosize mah={200} type="auto" scrollbars="y" offsetScrollbars>
                                        <RuleChangesList rules={customRules} />
                                    </ScrollArea.Autosize>
                                </Alert>
                            )}
                            {spectator && (
                                <Select
                                    label={intl.formatMessage({
                                        defaultMessage: "Following",
                                        description: "Label for the player picker while spectating a game",
                                    })}
                                    leftSection={<IconEye size={18} stroke={2.2} />}
                                    disabled={status.phase !== "ready" || followablePlayers.length === 0}
                                    allowDeselect={false}
                                    value={spectating}
                                    onChange={(guid) => guid && followPlayer(guid)}
                                    data={followablePlayers
                                        .map((p) => ({ value: p.guid, label: p.name ?? p.guid }))
                                        .sort((a, b) =>
                                            a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
                                        )}
                                />
                            )}
                            <Button
                                onClick={downloadReplay}
                                disabled={status.phase !== "ready" || replayDownload.phase !== "idle"}
                                color="grass"
                                fullWidth
                                rightSection={<IconFileDownload stroke={2.4} />}
                            >
                                <ReplayButtonLabel download={replayDownload} />
                            </Button>
                        </Stack>
                    </Panel>
                }
            />
        </>
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
