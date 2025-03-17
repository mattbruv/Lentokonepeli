import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconFileDownloadFilled } from "@tabler/icons-react";
import saveAs from "file-saver";
import { useEffect, useRef } from "react";
import { Game } from "./components/Game";
import { useSettingsContext } from "./contexts/settingsContext";
import { useLocalHost } from "./hooks/useLocalHost";
import { LevelName } from "./Lobby";

type HostProps = {
    level: LevelName;
    recordGame: boolean;
};

export function Host({ level, recordGame }: HostProps) {
    const gameContainer = useRef<HTMLDivElement>(null);
    const { getUsername, getClan } = useSettingsContext();

    const { getReplayBinary, initialize, roomCode, hostGame, playerData, showScoreboard, showChat, playerGuid } =
        useLocalHost(level, recordGame, getUsername(), getClan());

    // const [joinId, setJoinId] = useState("")
    // const [tickRate, setTickRate] = useState(100)

    async function host() {
        if (!gameContainer.current) return;
        await initialize(gameContainer.current);
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
        <Group>
            <Game
                ref={gameContainer}
                myPlayerGuid={playerGuid}
                playerData={playerData}
                showScoreboard={showScoreboard}
                showChat={showChat}
            />
            <Card withBorder style={{ height: "100%" }}>
                <Stack>
                    <Stack>
                        <Text>Game Code:</Text>
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
                            Save Replay File
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Group>
    );
}
