import { Card, Group, Stack, Text } from "@mantine/core";
import { useEffect, useRef } from "react";
import { useSettingsContext } from "../contexts/settingsContext";
import { useGuest } from "../hooks/useGuest";
import { Game } from "./Game";

type GuestProps = {
    gameCode: string;
};

export function Guest({ gameCode }: GuestProps) {
    const gameContainer = useRef<HTMLDivElement>(null);

    const { getClan, getUsername } = useSettingsContext();

    const { initialize, joinGame, playerData, playerGuid, messages, sendChatMessage } = useGuest(
        getUsername(),
        getClan(),
    );

    function join() {
        if (!gameContainer.current) return;
        initialize(gameContainer.current);
        joinGame(gameCode);
    }

    useEffect(() => {
        join();
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
