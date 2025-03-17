import { Alert, Button, Card, FileButton, Group, LoadingOverlay, Stack, Title, Tooltip } from "@mantine/core";
import { IconFileUpload, IconInfoCircle } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { Game } from "./components/Game";
import { useReplay } from "./hooks/useReplay";

enum ReplayState {
    ProvideFile,
    ReadingFile,
    Watching,
}

export function Replay() {
    const { loadReplay, initialize, playerData, showScoreboard, showChat, playerGuid } = useReplay();

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
                    initialize(gameContainer.current).then(() => {
                        const didReadFile = loadReplay(bytes);

                        if (didReadFile) {
                            setState(ReplayState.Watching);
                        } else {
                            setState(ReplayState.ProvideFile);
                        }
                    });
                }
            }
        };
        reader.readAsArrayBuffer(payload);
    }

    return (
        <Group>
            <Game
                ref={gameContainer}
                myPlayerGuid={playerGuid}
                playerData={playerData}
                showScoreboard={showScoreboard}
                showChat={showChat}
            />
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
                                <Title order={2}>Watch a Game Replay</Title>
                                <Stack>
                                    <FileButton onChange={onUploadFile} accept=".lento">
                                        {(props) => (
                                            <Tooltip
                                                openDelay={500}
                                                position={"bottom"}
                                                label="A replay file can be downloaded at any time when hosting a game."
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
                                                    Select Replay
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </FileButton>
                                    <Alert
                                        style={{ maxWidth: 400 }}
                                        variant="light"
                                        color="yellow"
                                        title="Replay System Notice"
                                        icon={<IconInfoCircle />}
                                    >
                                        <div>
                                            The replay system is currently experimental, lacking features, and still in
                                            active development. You may experience problems until the replay feature is
                                            in a stable state.
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
