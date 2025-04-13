import { Alert, Button, Card, FileButton, Group, LoadingOverlay, Stack, Title, Tooltip } from "@mantine/core";
import { IconFileUpload, IconInfoCircle } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Game } from "../components/Game";
import { useReplay } from "../hooks/useReplay";

enum ReplayState {
    ProvideFile,
    ReadingFile,
    Watching,
}

export function Replay() {
    const intl = useIntl();
    const { loadReplay, replayEvents, initialize, playerData, playerGuid, messages } = useReplay();

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
                    const didReadFile = loadReplay(bytes);

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

    return (
        <Group justify="center">
            <Game
                ref={gameContainer}
                myPlayerGuid={playerGuid}
                playerData={playerData}
                messages={messages}
                onSendMessage={() => {}}
            />
            {state === ReplayState.Watching && (
                <div>
                    <div>Events: {JSON.stringify(replayEvents)}</div>
                </div>
            )}
            {state === ReplayState.ProvideFile && (
                <div>
                    <Group>
                        <Card
                            shadow="xl"
                            padding="xl"
                            radius="md"
                            withBorder
                            style={{ maxWidth: 500, textAlign: "center" }}
                        >
                            <Stack>
                                <Title order={2}>
                                    <FormattedMessage
                                        defaultMessage={"Watch a Game Replay"}
                                        description={"Title for the Replay System page"}
                                    />
                                </Title>
                                <Stack>
                                    <FileButton onChange={onUploadFile} accept=".lento">
                                        {(props) => (
                                            <Tooltip
                                                openDelay={500}
                                                position={"bottom"}
                                                label={intl.formatMessage({
                                                    defaultMessage:
                                                        "A replay file can be downloaded at any time when hosting a game.",
                                                    description:
                                                        "Tooltip for a button explaining that replay files can be downloaded during gameplay, this button will be used to find a replay file from the user's computer",
                                                })}
                                            >
                                                <Button
                                                    {...props}
                                                    variant="gradient"
                                                    gradient={{ from: "yellow", to: "red", deg: 90 }}
                                                    disabled={false}
                                                    color={"blue"}
                                                    size={"lg"}
                                                    rightSection={<IconFileUpload />}
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
                                        style={{ maxWidth: 400 }}
                                        variant="light"
                                        color="yellow"
                                        title={intl.formatMessage({
                                            defaultMessage: "Replay System Notice",
                                            description: "title for a notice section for the Replay System",
                                        })}
                                        icon={<IconInfoCircle />}
                                    >
                                        <div>
                                            <FormattedMessage
                                                defaultMessage={
                                                    "The replay system is currently experimental, lacking features, and still inactive development. You may experience problems until the replay feature isin a stable state."
                                                }
                                                description={
                                                    "Informative text about the current state of the replay system"
                                                }
                                            />
                                        </div>
                                    </Alert>
                                </Stack>
                            </Stack>
                        </Card>
                    </Group>
                </div>
            )}
            {state === ReplayState.ReadingFile && (
                <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            )}
        </Group>
    );
}
