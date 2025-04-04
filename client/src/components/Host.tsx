import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconFileDownloadFilled } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";
import { useLocalHost } from "../hooks/useLocalHost";
import { LevelName } from "../views/Lobby";
import { Game } from "./Game";

type HostProps = {
    level: LevelName;
    recordGame: boolean;
};

export function Host({ level, recordGame }: HostProps) {
    const gameContainer = useRef<HTMLDivElement>(null);
    const { getUsername, getClan } = useSettingsContext();

    const { getReplayBinary, initialize, roomCode, hostGame, playerData, playerGuid, messages, sendChatMessage } =
        useLocalHost(level, recordGame, getUsername(), getClan());

    // const [joinId, setJoinId] = useState("")
    // const [tickRate, setTickRate] = useState(100)

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
        <Group justify="center">
            <Game
                ref={gameContainer}
                myPlayerGuid={playerGuid}
                playerData={playerData}
                messages={messages}
                onSendMessage={sendChatMessage}
            />
            <Card withBorder style={{ height: "100%" }}>
                <Stack>
                    <Stack>
                        <Text>
                            <FormattedMessage
                                defaultMessage={"Game Code"}
                                description={"Title shown above the shareable room code"}
                            />
                            :
                        </Text>
                        <Text
                            style={{ color: "gray", fontSize: "1.5rem", fontFamily: "monospace" }}
                            size={"xl"}
                            fw={"bold"}
                        >
                            {roomCode}
                        </Text>
                    </Stack>
                    <Stack>
                        <Button onClick={saveReplay} rightSection={<IconFileDownloadFilled />}>
                            <FormattedMessage
                                defaultMessage={"Save Replay File"}
                                description={"Button text for button which saves replay file"}
                            />
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Group>
    );
}
