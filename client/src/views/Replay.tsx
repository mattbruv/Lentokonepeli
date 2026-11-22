import { Alert, Button, FileButton, LoadingOverlay, Stack, Tooltip } from "@mantine/core";
import { IconFileUpload, IconInfoCircle, IconMovie } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import replayArt from "../assets/ui/pic_plane7.gif";
import { Game } from "../components/Game";
import { GameStage } from "../components/GameStage";
import { ReplayControls } from "../components/ReplayControls";
import { Panel } from "../components/ui/Panel";
import { useReplay } from "../hooks/useReplay";
import classes from "./Replay.module.css";

enum ReplayState {
    ProvideFile,
    ReadingFile,
    Watching,
}

export function Replay() {
    const intl = useIntl();
    const { replaySummary, replayCallbacks, initialize, playerData, intermission, playerGuid, messages, replayInfo } =
        useReplay();

    const [state, setState] = useState<ReplayState>(ReplayState.ProvideFile);
    const gameContainer = useRef<HTMLDivElement>(null);

    async function onUploadFile(payload: File | null): Promise<void> {
        if (!payload) return;

        setState(ReplayState.ReadingFile);

        const reader = new FileReader();

        reader.onloadend = (_event) => {
            if (reader.result instanceof ArrayBuffer) {
                const bytes = new Uint8Array(reader.result);

                if (gameContainer.current) {
                    initialize(gameContainer.current);
                    const didReadFile = replayCallbacks.loadReplay(bytes);

                    if (didReadFile) {
                        setState(ReplayState.Watching);
                    } else {
                        setState(ReplayState.ProvideFile);
                    }
                }
            }
        };
        reader.readAsArrayBuffer(payload);
    }

    const watching = state === ReplayState.Watching;

    return (
        <>
            {state !== ReplayState.Watching && (
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
                            <Alert
                                variant="light"
                                color="copper"
                                title={intl.formatMessage({
                                    defaultMessage: "Replay System Notice",
                                    description: "title for a notice section for the Replay System",
                                })}
                                icon={<IconInfoCircle />}
                            >
                                <FormattedMessage
                                    defaultMessage={
                                        "The replay system is currently experimental, lacking features, and still inactive development. You may experience problems until the replay feature isin a stable state."
                                    }
                                    description={"Informative text about the current state of the replay system"}
                                />
                            </Alert>
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
                    />
                }
                side={
                    watching &&
                    replaySummary && (
                        <Panel className={classes.controlsPanel}>
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
