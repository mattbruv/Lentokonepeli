import { useEffect, useRef } from "react";
import { useGuest } from "./hooks/useGuest";
import { Group, Card, Stack, Text } from "@mantine/core";
import { useSettingsContext } from "./contexts/settingsContext";


type GuestProps = {
    gameCode: string
}

export function Guest({ gameCode }: GuestProps) {

    const gameContainer = useRef<HTMLDivElement>(null);

    const { getClan, getUsername } = useSettingsContext()

    const {
        initialize,
        joinGame
    } = useGuest(getUsername(), getClan())

    async function join() {
        if (!gameContainer.current) return;
        await initialize(gameContainer.current)
        joinGame(gameCode)
    }

    useEffect(() => {
        join()
    }, [])

    return (
        <Group>
            <div ref={gameContainer}></div>
            <Card withBorder style={{ height: '100%' }}>
                <Stack>
                    <Text>Joined Game:</Text>
                    <Text style={{ color: "gray", fontSize: "1.5rem", fontFamily: "monospace" }} size={"xl"} fw={"bold"}>{gameCode}</Text>
                </Stack>
            </Card>
        </Group>
    )
}