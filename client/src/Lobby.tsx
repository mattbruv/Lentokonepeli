import { useState } from "react";
import { Button, Card, Text, Grid, Group, Modal, Select, TextInput, Title, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import Levels from "./assets/levels.json"
import { Host } from "./Host";
import { Guest } from "./Guest";
import { isValidClan, isValidName, useSettingsContext } from "./contexts/settingsContext";

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

  const [name, setName] = useState<string>("")
  const [clan, setClan] = useState<string>("")

  const [opened, { open, close }] = useDisclosure()
  const { settings, setSettings } = useSettingsContext()

  function promptUsername() {
    if (!settings.username) {
      // Open the user modal if the user hasn't provided a username
      open()
    }
  }

  function setUsername(event: React.ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value.trim())
  }

  function setClanName(event: React.ChangeEvent<HTMLInputElement>): void {
    setClan(event.target.value.trim())
  }

  function canSubmitModal() {
    return isValidName(name) && isValidClan(clan)
  }

  function confirmName(): void {
    setSettings({
      ...settings,
      username: name,
      clan: clan
    })

    close()
  }

  return (
    <div>
      <Modal opened={opened} closeOnClickOutside={false} onClose={close} title="Choose Username">
        <Stack>
          <div>
            <Text size={"lg"}>What name do you want to go by?</Text>
          </div>
          <TextInput onChange={setUsername} label="Username" description="You can change this any time in the settings menu" />
          <TextInput onChange={setClanName} label="Clan" description="An optional clan to prefix to your name" />
          <Tooltip disabled={canSubmitModal()} label={"Name should be between 3 and 20 characters"} position={"bottom"}>
            <Button
              variant="gradient"
              gradient={{ from: "green", to: "lime", deg: 90 }}
              disabled={canSubmitModal() == false}
              size={"lg"}
              onClick={confirmName}
            >
              Set Name
            </Button>
          </Tooltip>

        </Stack>
        {/* Modal content */}
      </Modal>
      {lobbyState === LobbyState.Choosing && (
        <Grid grow>
          {/* Left Side - Join a Game */}
          <Grid.Col span={6} style={{ maxWidth: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Card shadow="xl" padding="xl" radius="md" withBorder style={{ width: "80%", textAlign: "center" }}>
              <Stack>
                <Title order={2}>Join a Game</Title>
                <Group >
                  <Text>Code:</Text>
                  <TextInput value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Enter the 4 digit game code..." />
                </Group>
                <Button
                  onMouseOver={promptUsername}
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
                <Button
                  onMouseOver={promptUsername}
                  size={"lg"}
                  variant={"gradient"}
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                  disabled={false}
                  onClick={() => setLobbyState(LobbyState.Hosting)}
                >
                  Host Game
                </Button>
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
