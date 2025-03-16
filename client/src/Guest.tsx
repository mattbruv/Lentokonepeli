import { Card, Group, Stack, Text } from "@mantine/core";
import { useEffect, useRef } from "react";
import { Game } from "./components/Game";
import { useSettingsContext } from "./contexts/settingsContext";
import { useGuest } from "./hooks/useGuest";

type GuestProps = {
    gameCode: string;
};

export function Guest({ gameCode }: GuestProps) {
    const gameContainer = useRef<HTMLDivElement>(null);

    const { getClan, getUsername } = useSettingsContext();

    const { initialize, joinGame, playerData, showScoreboard, playerGuid } = useGuest(getUsername(), getClan());

    async function join() {
        if (!gameContainer.current) return;
        await initialize(gameContainer.current);
        joinGame(gameCode);
    }

    useEffect(() => {
        join();
    }, []);

    return (
        <Group>
            <Game
                ref={gameContainer}
                myPlayerGuid={playerGuid}
                playerData={playerData}
                showScoreboard={showScoreboard}
            />
            <Card withBorder style={{ height: "100%" }}>
                <Stack>
                    <Text>Joined Game:</Text>
                    <Text
                        style={{ color: "gray", fontSize: "1.5rem", fontFamily: "monospace" }}
                        size={"xl"}
                        fw={"bold"}
                    >
                        {gameCode}
                    </Text>
                </Stack>
            </Card>
        </Group>
    );
}
