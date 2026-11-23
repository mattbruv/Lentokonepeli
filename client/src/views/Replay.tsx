import { Alert, Button, FileButton, Group, LoadingOverlay, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconFileUpload, IconMovie, IconPlayerStop } from "@tabler/icons-react";
import { ReplayVersion } from "dogfight-types/ReplayVersion";
import { useActiveView } from "../hooks/useActiveView";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import replayArt from "../assets/ui/pic_plane7.gif";
import { Game } from "../components/Game";
import { GameStage } from "../components/GameStage";
import { ReplayControls } from "../components/ReplayControls";
import { ReplayInspector } from "../components/ReplayInspector";
import { Panel } from "../components/ui/Panel";
import { StatusCard, StatusOverlay } from "../components/ui/StatusCard";
import { useReplay } from "../hooks/useReplay";
import classes from "./Replay.module.css";

enum ReplayState {
    ProvideFile,
    ConfirmVersion,
    ReadingFile,
    Watching,
}

type LoadError = "unreadable" | "failed";

type PendingReplay = {
    bytes: Uint8Array;
    version: ReplayVersion;
};

export function Replay() {
    const [session, setSession] = useState(0);
    const [loadError, setLoadError] = useState<LoadError | null>(null);

    function restart(error: LoadError | null) {
        setLoadError(error);
        setSession((n) => n + 1);
    }

    return (
        <ReplaySession
            key={session}
            loadError={loadError}
            onLoadError={(error) => restart(error)}
            onReset={() => restart(null)}
            onClearError={() => setLoadError(null)}
        />
    );
}

type ReplaySessionProps = {
    loadError: LoadError | null;
    onLoadError: (error: LoadError) => void;
    onReset: () => void;
    onClearError: () => void;
};

function formatVersion(version: ReplayVersion) {
    return `v${version.build_version} (${version.build_commit})`;
}

function ReplaySession({ loadError, onLoadError, onReset, onClearError }: ReplaySessionProps) {
    const intl = useIntl();
    const {
        replaySummary,
        replayCallbacks,
        initialize,
        getCurrentVersion,
        getReplayVersion,
        playbackFailed,
        inspection,
        playerData,
        intermission,
        playerGuid,
        messages,
        replayInfo,
    } = useReplay();

    const [state, setState] = useState<ReplayState>(ReplayState.ProvideFile);
    const [pending, setPending] = useState<PendingReplay | null>(null);
    const [versionMismatch, setVersionMismatch] = useState<ReplayVersion | null>(null);
    const gameContainer = useRef<HTMLDivElement>(null);

    const currentVersion = getCurrentVersion();

    function startReplay(bytes: Uint8Array) {
        setState(ReplayState.ReadingFile);

        requestAnimationFrame(() =>
            setTimeout(() => {
                if (!gameContainer.current) return;
                initialize(gameContainer.current);
                if (replayCallbacks.loadReplay(bytes)) {
                    setState(ReplayState.Watching);
                } else {
                    onLoadError("failed");
                }
            }, 0),
        );
    }

    function onUploadFile(payload: File | null): void {
        if (!payload) return;

        onClearError();
        setState(ReplayState.ReadingFile);

        const reader = new FileReader();

        reader.onloadend = () => {
            if (!(reader.result instanceof ArrayBuffer)) {
                onLoadError("unreadable");
                return;
            }

            const bytes = new Uint8Array(reader.result);
            const version = getReplayVersion(bytes);

            if (!version) {
                onLoadError("unreadable");
                return;
            }

            if (version.build_version !== currentVersion.build_version) {
                setPending({ bytes, version });
                setState(ReplayState.ConfirmVersion);
                return;
            }

            startReplay(bytes);
        };
        reader.readAsArrayBuffer(payload);
    }

    function confirmPending() {
        if (!pending) return;
        setVersionMismatch(pending.version);
        setPending(null);
        startReplay(pending.bytes);
    }

    function cancelPending() {
        setPending(null);
        setState(ReplayState.ProvideFile);
    }

    const watching = state === ReplayState.Watching;

    useActiveView("replay", watching);

    return (
        <>
            <Modal
                opened={state === ReplayState.ConfirmVersion}
                onClose={cancelPending}
                centered
                title={intl.formatMessage({
                    defaultMessage: "Replay from a different version",
                    description: "Title of the dialog warning that a replay was recorded with another game version",
                })}
            >
                <Stack gap="md">
                    <Text size="sm">
                        <FormattedMessage
                            defaultMessage={
                                "This replay was recorded with a different version of the game. It may desync or fail to play properly."
                            }
                            description={"Warning shown before watching a replay recorded with another game version"}
                        />
                    </Text>
                    {pending && (
                        <dl className={classes.versions}>
                            <dt>
                                <FormattedMessage
                                    defaultMessage={"Replay version"}
                                    description={"Label for the game version a replay was recorded with"}
                                />
                            </dt>
                            <dd>{formatVersion(pending.version)}</dd>
                            <dt>
                                <FormattedMessage
                                    defaultMessage={"Current version"}
                                    description={"Label for the game version currently running"}
                                />
                            </dt>
                            <dd>{formatVersion(currentVersion)}</dd>
                        </dl>
                    )}
                    <Group justify="flex-end" gap="sm">
                        <Button variant="default" onClick={cancelPending}>
                            <FormattedMessage
                                defaultMessage={"Cancel"}
                                description={"Button that cancels watching an out of date replay"}
                            />
                        </Button>
                        <Button color="copper" onClick={confirmPending}>
                            <FormattedMessage
                                defaultMessage={"Watch anyway"}
                                description={"Button that starts watching a replay despite a version mismatch"}
                            />
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            {!watching && (
                <div className={classes.center}>
                    <Panel
                        pop
                        className={classes.uploadPanel}
                        icon={<IconMovie size={26} stroke={2.4} />}
                        title={
                            <FormattedMessage
                                defaultMessage={"Watch a Game Replay"}
                                description={"Title for the Replay System page"}
                            />
                        }
                    >
                        <Stack gap="lg">
                            <div className={classes.art}>
                                <img src={replayArt} alt="" />
                            </div>
                            {loadError && (
                                <Alert color="cherry" variant="light" icon={<IconAlertTriangle size={20} />}>
                                    {loadError === "unreadable" ? (
                                        <FormattedMessage
                                            defaultMessage={
                                                "This file couldn't be read. It may not be a replay, or it was recorded with a version of the game that is too old to open."
                                            }
                                            description={"Error shown when a selected replay file cannot be parsed"}
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage={
                                                "This replay couldn't be loaded. If it was recorded with a different version of the game, it may not be compatible."
                                            }
                                            description={"Error shown when a replay file fails to load"}
                                        />
                                    )}
                                </Alert>
                            )}
                            <FileButton onChange={onUploadFile} accept=".lento">
                                {(props) => (
                                    <Tooltip
                                        openDelay={500}
                                        position={"bottom"}
                                        multiline
                                        w={260}
                                        label={intl.formatMessage({
                                            defaultMessage:
                                                "A replay file can be downloaded at any time when hosting a game.",
                                            description:
                                                "Tooltip for a button explaining that replay files can be downloaded during gameplay, this button will be used to find a replay file from the user's computer",
                                        })}
                                    >
                                        <Button
                                            {...props}
                                            color={"copper"}
                                            size={"lg"}
                                            fullWidth
                                            rightSection={<IconFileUpload stroke={2.4} />}
                                        >
                                            <FormattedMessage
                                                defaultMessage={"Select Replay"}
                                                description={
                                                    "Button text for a button which opens system file system to select a lentokonepeli replay file from"
                                                }
                                            />
                                        </Button>
                                    </Tooltip>
                                )}
                            </FileButton>
                        </Stack>
                    </Panel>
                </div>
            )}
            <GameStage
                framed={watching}
                game={
                    <Game
                        ref={gameContainer}
                        myPlayerGuid={playerGuid}
                        playerData={playerData}
                        intermission={intermission}
                        messages={messages}
                        onSendMessage={() => {}}
                        overlay={
                            <>
                                {watching && !playbackFailed && <ReplayInspector inspection={inspection} />}
                                {watching && playbackFailed && (
                                    <StatusOverlay dim>
                                        <StatusCard
                                            icon={<IconPlayerStop size={40} stroke={2} />}
                                            title={
                                                <FormattedMessage
                                                    defaultMessage={"Replay stopped"}
                                                    description={"Title shown when replay playback hits an error"}
                                                />
                                            }
                                            actions={
                                                <Button color="copper" onClick={onReset}>
                                                    <FormattedMessage
                                                        defaultMessage={"Load another replay"}
                                                        description={
                                                            "Button that returns to the replay file picker after playback failed"
                                                        }
                                                    />
                                                </Button>
                                            }
                                        >
                                            <FormattedMessage
                                                defaultMessage={
                                                    "Playback hit an error at {time}. This usually happens when a replay was recorded with a different version of the game."
                                                }
                                                description={"Message shown when replay playback fails partway through"}
                                                values={{ time: replayInfo.timeString }}
                                            />
                                        </StatusCard>
                                    </StatusOverlay>
                                )}
                            </>
                        }
                    />
                }
                side={
                    watching &&
                    replaySummary && (
                        <Panel className={classes.controlsPanel}>
                            {versionMismatch && (
                                <Alert
                                    className={classes.mismatch}
                                    color="yellow"
                                    variant="light"
                                    icon={<IconAlertTriangle size={20} />}
                                >
                                    <FormattedMessage
                                        defaultMessage={
                                            "Recorded with {replayVersion}, you're running {currentVersion}. Playback may desync."
                                        }
                                        description={
                                            "Notice shown while watching a replay recorded with another game version"
                                        }
                                        values={{
                                            replayVersion: formatVersion(versionMismatch),
                                            currentVersion: formatVersion(currentVersion),
                                        }}
                                    />
                                </Alert>
                            )}
                            <ReplayControls
                                players={replaySummary?.players ?? {}}
                                events={replaySummary?.events ?? []}
                                info={replayInfo}
                                callbacks={replayCallbacks}
                                summary={replaySummary}
                            />
                        </Panel>
                    )
                }
            />
            {state === ReplayState.ReadingFile && (
                <LoadingOverlay
                    visible={true}
                    zIndex={1000}
                    loaderProps={{ color: "copper", type: "dots", size: "xl" }}
                    overlayProps={{ blur: 3, backgroundOpacity: 0.25 }}
                />
            )}
        </>
    );
}
