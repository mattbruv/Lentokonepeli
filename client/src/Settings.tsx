import { Accordion, ActionIcon, Button, Card, Group, Kbd, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceGamepad2, IconPlus, IconRestore, IconTrash, IconUser } from "@tabler/icons-react";
import React, { useState } from "react";
import { NameEditor } from "./components/Name";
import { DEFAULT_GAME_KEYBINDS, useSettingsContext } from "./contexts/settingsContext";
import { GameAction } from "./hooks/keybinds/models";

const keyDescriptions: Record<GameAction, string> = {
    left: "Move Left",
    right: "Move Right",
    down: "Toggle Motor",
    up: "Flip Plane",
    shift: "Bomb",
    space: "Eject, Open Parachute",
    enter: "Enter",
    ctrl: "Shoot",
    chatAll: "Chat All",
    chatTeam: "Chat Team",
    viewScoreboard: "View Scoreboard",
};

export function Settings() {
    const { settings, setSettings } = useSettingsContext();
    const [addToAction, setAddToAction] = useState<GameAction | null>(null);
    const [opened, { open, close }] = useDisclosure(false);

    function removeKey(action: string): void {
        setSettings((prev) => ({
            ...prev,
            controls: prev.controls.filter((bind) => bind.action !== action),
        }));
    }

    function resetControls(): void {
        setSettings((prev) => ({
            ...prev,
            controls: DEFAULT_GAME_KEYBINDS,
        }));
    }

    function addKey(action: GameAction): void {
        setAddToAction(action);
        open();
    }

    function registerKey(event: React.KeyboardEvent): void {
        if (!addToAction) return;
        const newKey = event.key;

        if (!settings.controls.some((bind) => bind.key === newKey && bind.action === addToAction)) {
            setSettings((prev) => ({
                ...prev,
                controls: [...prev.controls, { key: newKey, action: addToAction }],
            }));
        }

        close();
    }

    return (
        <div>
            {addToAction && (
                <Modal onKeyDown={registerKey} opened={opened} onClose={close} title="Add Key Binding">
                    <Text size={"xl"} fw={"bold"}>
                        {keyDescriptions[addToAction]}
                    </Text>
                    Press any key...
                </Modal>
            )}
            <Accordion defaultValue="Apples">
                <Accordion.Item key={"user"} value={"user"}>
                    <Accordion.Control icon={<IconUser />}>User Settings</Accordion.Control>
                    <Accordion.Panel>
                        <div style={{ maxWidth: 300 }}>
                            <NameEditor showTip={false} />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key={"controls"} value={"controls"}>
                    <Accordion.Control icon={<IconDeviceGamepad2 />}>Control Settings</Accordion.Control>
                    <Accordion.Panel>
                        <Card>
                            <Stack>
                                {Object.entries(keyDescriptions).map(([action, description]) => (
                                    <Group key={action}>
                                        {description}:
                                        {settings.controls
                                            .filter((bind) => bind.action === action)
                                            .map((bind) => {
                                                const count = settings.controls.filter(
                                                    (b) => b.key === bind.key,
                                                ).length;
                                                return (
                                                    <Kbd
                                                        style={{ backgroundColor: count > 1 ? "red" : "" }}
                                                        key={bind.key}
                                                    >
                                                        {bind.key === " " ? "Space" : bind.key}
                                                    </Kbd>
                                                );
                                            })}
                                        <Tooltip openDelay={250} label="Add New Key">
                                            <ActionIcon
                                                onClick={() => addKey(action as GameAction)}
                                                color={"green"}
                                                variant={"subtle"}
                                            >
                                                <IconPlus />
                                            </ActionIcon>
                                        </Tooltip>
                                        {settings.controls.some((bind) => bind.action === action) && (
                                            <Tooltip openDelay={250} label="Unbind Last Key">
                                                <ActionIcon
                                                    onClick={() => removeKey(action)}
                                                    color={"red"}
                                                    variant={"subtle"}
                                                >
                                                    <IconTrash />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                ))}
                                <div>
                                    {JSON.stringify(settings.controls) !== JSON.stringify(DEFAULT_GAME_KEYBINDS) && (
                                        <Button onClick={resetControls} rightSection={<IconRestore />}>
                                            Reset Controls
                                        </Button>
                                    )}
                                </div>
                            </Stack>
                        </Card>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}
