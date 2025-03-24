import { useState } from "react";
import { Button, Card, Text, Grid, Group, Modal, Select, TextInput, Title, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import Levels from "./assets/levels.json";
import { Host } from "./Host";
import { Guest } from "./Guest";
import { useSettingsContext } from "./contexts/settingsContext";
import { NameEditor } from "./components/Name";
import { FormattedMessage, useIntl } from "react-intl";

export type LevelName = keyof typeof Levels;

enum LobbyState {
    Choosing,
    Hosting,
    Joining,
}

export function Lobby() {
    const intl = useIntl();
    const [lobbyState, setLobbyState] = useState<LobbyState>(LobbyState.Choosing);

    // Hosting state
    const [gameMap, setGameMap] = useState<LevelName>("classic");

    // Joining state
    const [joinId, setJoinId] = useState<string>("");

    const [opened, { open, close }] = useDisclosure();
    const { settings } = useSettingsContext();

    function promptUsername() {
        if (!settings.username) {
            // Open the user modal if the user hasn't provided a username
            open();
        }
    }

    return (
        <div>
            <Modal
                opened={opened}
                closeOnClickOutside={false}
                onClose={close}
                title={intl.formatMessage({
                    defaultMessage: "Choose Username",
                    description: "Title for modal used to choose username",
                })}
            >
                <NameEditor showTip onSuccess={close} />
                {/* Modal content */}
            </Modal>
            {lobbyState === LobbyState.Choosing && (
                <Grid grow>
                    {/* Left Side - Join a Game */}
                    <Grid.Col
                        span={6}
                        style={{ maxWidth: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <Card
                            shadow="xl"
                            padding="xl"
                            radius="md"
                            withBorder
                            style={{ width: "80%", textAlign: "center" }}
                        >
                            <Stack>
                                <Title order={2}>Join a Game</Title>
                                <Group>
                                    <Text>Code:</Text>
                                    <TextInput
                                        value={joinId}
                                        onChange={(e) => setJoinId(e.target.value)}
                                        placeholder={intl.formatMessage({
                                            defaultMessage: "Enter the 4 digit game code...",
                                            description:
                                                "Infotext for input which is used to insert 4 digit game code to join games",
                                        })}
                                    />
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
                                    <FormattedMessage
                                        defaultMessage={"Join Game"}
                                        description={
                                            "Call to action button text for button which joins a an existing game"
                                        }
                                    />
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* Right Side - Host a Game */}
                    <Grid.Col
                        span={6}
                        style={{ maxWidth: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <Card
                            shadow="xl"
                            padding="xl"
                            radius="md"
                            withBorder
                            style={{ width: "80%", textAlign: "center" }}
                        >
                            <Stack>
                                <Title order={2}>Host a Game</Title>
                                <Group>
                                    <Text>Level:</Text>
                                    <Select
                                        data={Object.keys(Levels)}
                                        value={gameMap}
                                        onChange={(v) => {
                                            if (v) {
                                                setGameMap(v as keyof typeof Levels);
                                            }
                                        }}
                                        placeholder={intl.formatMessage({
                                            defaultMessage: "Select a game map...",
                                            description:
                                                "Infotext for input used to select which map will be used for the hosted game",
                                        })}
                                    />
                                </Group>
                                <Button
                                    onMouseOver={promptUsername}
                                    size={"lg"}
                                    variant={"gradient"}
                                    gradient={{ from: "blue", to: "cyan", deg: 90 }}
                                    disabled={false}
                                    onClick={() => setLobbyState(LobbyState.Hosting)}
                                >
                                    <FormattedMessage
                                        defaultMessage={"Host Game"}
                                        description={
                                            "Call to action button text for button which starts a new game as a Host"
                                        }
                                    />
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            )}
            {lobbyState === LobbyState.Hosting && <Host level={gameMap} recordGame={false} />}
            {lobbyState === LobbyState.Joining && <Guest gameCode={joinId} />}
        </div>
    );
}
