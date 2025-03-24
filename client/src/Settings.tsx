import { Accordion, ActionIcon, Button, Card, Group, Kbd, Modal, Select, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceGamepad2, IconPlus, IconRestore, IconSitemap, IconTrash, IconUser } from "@tabler/icons-react";
import React, { useState } from "react";
import { NameEditor } from "./components/Name";
import { DEFAULT_GAME_KEYBINDS, SETTING_DESCRIPTIONS, useSettingsContext } from "./contexts/settingsContext";
import { GameAction } from "./hooks/keybinds/models";
import { FormattedMessage, useIntl } from "react-intl";
import { DEFAULT_LOCALE } from "./intl/IntlProvider";

export function Settings() {
    const { settings, setSettings } = useSettingsContext();
    const [addToAction, setAddToAction] = useState<GameAction | null>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const intl = useIntl();

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
                <Modal
                    onKeyDown={registerKey}
                    opened={opened}
                    onClose={close}
                    title={intl.formatMessage({
                        defaultMessage: "Add Key Binding",
                        description: "Title for modal where keybinds are added",
                    })}
                >
                    <Text size={"xl"} fw={"bold"}>
                        {SETTING_DESCRIPTIONS[addToAction]}
                    </Text>
                    <FormattedMessage
                        defaultMessage={"Press any key..."}
                        description={"Info text explaining to press any key to set a keybind for a game action"}
                    />
                </Modal>
            )}
            <Accordion defaultValue="Apples">
                <Accordion.Item key={"user"} value={"user"}>
                    <Accordion.Control icon={<IconUser />}>
                        <FormattedMessage
                            defaultMessage={"User Settings"}
                            description={"Title for a settings section used to modify user info used in-game"}
                        />
                    </Accordion.Control>
                    <Accordion.Panel>
                        <div style={{ maxWidth: 300 }}>
                            <NameEditor showTip={false} />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key={"controls"} value={"controls"}>
                    <Accordion.Control icon={<IconDeviceGamepad2 />}>
                        <FormattedMessage
                            defaultMessage={"Control Settings"}
                            description={"Title for a settings section used to modify the keybinds used in-game"}
                        />
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Card>
                            <Stack>
                                {Object.entries(SETTING_DESCRIPTIONS).map(([action, description]) => (
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
                                        <Tooltip
                                            openDelay={250}
                                            label={intl.formatMessage({
                                                defaultMessage: "Add new key",
                                                description:
                                                    "Tooltip for a button used to add a new keybind for an action",
                                            })}
                                        >
                                            <ActionIcon
                                                onClick={() => addKey(action as GameAction)}
                                                color={"green"}
                                                variant={"subtle"}
                                            >
                                                <IconPlus />
                                            </ActionIcon>
                                        </Tooltip>
                                        {settings.controls.some((bind) => bind.action === action) && (
                                            <Tooltip
                                                openDelay={250}
                                                label={intl.formatMessage({
                                                    defaultMessage: "Unbind Last Key",
                                                    description:
                                                        "Tooltip for a button used to remove last keybind from an action",
                                                })}
                                            >
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
                                            <FormattedMessage
                                                defaultMessage={"Reset Controls"}
                                                description={
                                                    "Button used to reset user defined keybinds on the settings page"
                                                }
                                            />
                                        </Button>
                                    )}
                                </div>
                            </Stack>
                        </Card>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item key={"site"} value={"site"}>
                    <Accordion.Control icon={<IconSitemap />}>
                        <FormattedMessage
                            defaultMessage={"Site Settings"}
                            description={"Title for a settings section used to modify general site settings"}
                        />
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Select
                            label="Select Locale"
                            value={settings.locale}
                            onChange={(_, item) => {
                                setSettings({
                                    ...settings,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    locale: (item?.value as any) ?? DEFAULT_LOCALE,
                                });
                            }}
                            data={[
                                { value: "en", label: "English" },
                                { value: "fi", label: "Finnish" },
                            ]}
                            placeholder="Choose locale"
                        />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}
