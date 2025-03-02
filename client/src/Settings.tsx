import { Accordion, Card, Text, Group, Kbd, Stack, ActionIcon, Tooltip, Button, Modal } from "@mantine/core";
import { IconDeviceGamepad2, IconPlus, IconRestore, IconTrash, IconUser } from "@tabler/icons-react";
import { GameKey, getDefaultControls, useSettingsContext } from "./contexts/settingsContext";
import { useDisclosure } from "@mantine/hooks";
import React, { useState } from "react";



const keyDescriptions: Record<GameKey, string> = {
    left: "Move Left",
    right: "Move Right",
    down: "Toggle Motor",
    up: "Flip Plane",
    shift: "Bomb",
    space: "Eject, Open Parachute",
    enter: "Enter",
    ctrl: "Shoot"
}

export function Settings() {

    const { settings, setSettings } = useSettingsContext()

    const [addToGameKey, setAddToGameKey] = useState<GameKey | null>(null)
    const [opened, { open, close }] = useDisclosure(false);

    function removeKey(gameKey: GameKey): void {
        console.log(gameKey)

        setSettings((prev) => {
            const next = prev.controls[gameKey].slice(0, -1)
            console.log(next)
            return ({
                ...prev,
                controls: {
                    ...prev.controls,
                    [gameKey]: next
                }
            });
        })
    }

    function resetControls(): void {
        setSettings(prev => ({
            ...prev,
            controls: getDefaultControls()
        }))
    }

    function addKey(gameKey: GameKey): void {
        setAddToGameKey(gameKey)
        open()
    }

    function registerKey(event: React.KeyboardEvent): void {
        if (!addToGameKey) return;
        const existing = settings.controls[addToGameKey];
        const newKey = event.key

        if (!existing.includes(newKey)) {
            setSettings(prev => ({
                ...prev,
                controls: {
                    ...prev.controls,
                    [addToGameKey]: prev.controls[addToGameKey].concat(newKey)
                }
            }))
        }

        close()
    }

    return (
        <div>
            {addToGameKey && (
                <Modal onKeyDown={registerKey} opened={opened} onClose={close} title="Add Key Binding">
                    <Text size={"xl"} fw={"bold"}>
                        {keyDescriptions[addToGameKey]}
                    </Text>
                    Press any key...
                </Modal>
            )}
            <Accordion defaultValue="Apples">
                <Accordion.Item key={"user"} value={"user"}>
                    <Accordion.Control icon={<IconUser />}>User Settings</Accordion.Control>
                    <Accordion.Panel>
                        <div>
                            user settings
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key={"controls"} value={"controls"}>
                    <Accordion.Control icon={<IconDeviceGamepad2 />}>Control Settings</Accordion.Control>
                    <Accordion.Panel>
                        <Card>
                            <Stack>
                                {Object.entries(settings.controls).map(([gameKey, keys]) => (
                                    <Group key={gameKey}>
                                        {keyDescriptions[gameKey as GameKey]}:
                                        {keys.map(key => {
                                            const count = Object.values(settings.controls).flatMap(x => x).filter(x => x === key).length;
                                            return (
                                                <Kbd style={{ backgroundColor: count > 1 ? "red" : "" }} key={key}>{key === " " ? "Space" : key}</Kbd>
                                            );
                                        })}
                                        <Tooltip openDelay={250} label="Add New Key">
                                            <ActionIcon onClick={() => addKey(gameKey as GameKey)} color={"green"} variant={"subtle"}><IconPlus /></ActionIcon>
                                        </Tooltip>
                                        {keys.length > 0 && (
                                            <Tooltip openDelay={250} label="Unbind Last Key">
                                                <ActionIcon onClick={() => removeKey(gameKey as GameKey)} color={"red"} variant={"subtle"}><IconTrash /></ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                ))}
                                <div>
                                    {JSON.stringify(settings.controls) !== JSON.stringify(getDefaultControls()) && (
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
    )
}