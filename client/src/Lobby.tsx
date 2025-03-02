import { useState } from "react";
import { Button, Card, Text, Grid, Group, Modal, Select, TextInput, Title, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import Levels from "./assets/levels.json"
import { Host } from "./Host";
import { Guest } from "./Guest";

export type LevelName = keyof typeof Levels

enum LobbyState {
  Choosing,
  Hosting,
  Joining,
}

export function Lobby() {

  const [lobbyState, setLobbyState] = useState<LobbyState>(LobbyState.Choosing)

  // Hosting state
  const [gameMap, setGameMap] = useState<LevelName>("classic")

  // Joining state
  const [joinId, setJoinId] = useState<string>("")

  const [opened, { open, close }] = useDisclosure()

  return (
    <div>
      {lobbyState === LobbyState.Choosing && (
        <Grid grow>
          {/* Left Side - Join a Game */}
          <Modal opened={opened} onClose={close} color={"green"} title="Join Game">
          </Modal>
          <Grid.Col span={6} style={{ maxWidth: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Card shadow="xl" padding="xl" radius="md" withBorder style={{ width: "80%", textAlign: "center" }}>
              <Stack>
                <Title order={2}>Join a Game</Title>
                <Group >
                  <Text>Code:</Text>
                  <TextInput value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Enter the 4 digit game code..." />
                </Group>
                <Button
                  variant="gradient"
                  gradient={{ from: "green", to: "lime", deg: 90 }}
                  disabled={joinId.length != 4}
                  color={"blue"}
                  size={"lg"}
                  onClick={() => setLobbyState(LobbyState.Joining)}
                >
                  Join Game
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Right Side - Host a Game */}
          <Grid.Col span={6} style={{ maxWidth: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Card shadow="xl" padding="xl" radius="md" withBorder style={{ width: "80%", textAlign: "center" }}>
              <Stack>
                <Title order={2}>Host a Game</Title>
                <Group >
                  <Text>Level:</Text>
                  <Select data={Object.keys(Levels)} value={gameMap} onChange={(v) => { if (v) { setGameMap(v as keyof typeof Levels) } }} placeholder="Select a game map..." />
                </Group>
                <Button size={"lg"} variant={"gradient"} gradient={{ from: 'blue', to: 'cyan', deg: 90 }} disabled={false} onClick={() => setLobbyState(LobbyState.Hosting)}>Host Game</Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}
      {lobbyState === LobbyState.Hosting &&
        (
          <Host level={gameMap} recordGame={false} />
        )}
      {lobbyState === LobbyState.Joining && (
        <Guest gameCode={joinId} />
      )}
    </div>
  );
}
