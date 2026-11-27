import { Button, Kbd, Modal, Select, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceGamepad2, IconPlus, IconRestore, IconSitemap, IconUser, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import { defineMessage, FormattedMessage, MessageDescriptor, useIntl } from "react-intl";
import { NameEditor } from "../components/NameEditor";
import { LocaleFlag } from "../components/ui/LocaleFlag";
import { Panel } from "../components/ui/Panel";
import { DEFAULT_GAME_KEYBINDS, useSettingsContext } from "../contexts/settingsContext";
import { GameAction } from "../hooks/keybinds/models";
import { getDefaultLocale, KNOWN_LOCALE_DROPDOWN_VALUES, KnownLocale } from "../intl/IntlProvider";
import { KEYBIND_INTL } from "../intl/messages";
import classes from "./Settings.module.css";

const KEYBIND_GROUPS: { id: string; title: MessageDescriptor; actions: GameAction[] }[] = [
    {
        id: "flying",
        title: defineMessage({
            defaultMessage: "Flying",
            description: "Heading for the group of flight related keybinds on the settings page",
        }),
        actions: ["left", "right", "down", "up"],
    },
    {
        id: "combat",
        title: defineMessage({
            defaultMessage: "Combat",
            description: "Heading for the group of combat related keybinds on the settings page",
        }),
        actions: ["ctrl", "shift", "space"],
    },
    {
        id: "interface",
        title: defineMessage({
            defaultMessage: "Chat & Interface",
            description: "Heading for the group of chat and interface keybinds on the settings page",
        }),
        actions: ["enter", "chatAll", "chatTeam", "viewScoreboard", "toggleMute"],
    },
];

const KEY_LABELS: Record<string, string> = {
    " ": "Space",
    ArrowLeft: "\u2190",
    ArrowRight: "\u2192",
    ArrowUp: "\u2191",
    ArrowDown: "\u2193",
    Control: "Ctrl",
    Escape: "Esc",
};

function formatKey(key: string): string {
    if (key in KEY_LABELS) return KEY_LABELS[key];
    if (key.length === 1) return key.toUpperCase();
    return key.charAt(0).toUpperCase() + key.slice(1);
}

export function Settings() {
    const { settings, setSettings } = useSettingsContext();
    const [addToAction, setAddToAction] = useState<GameAction | null>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const intl = useIntl();

    function removeKey(action: GameAction, key: string): void {
        setSettings((prev) => ({
            ...prev,
            controls: prev.controls.filter((bind) => !(bind.action === action && bind.key === key)),
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

    const controlsChanged = JSON.stringify(settings.controls) !== JSON.stringify(DEFAULT_GAME_KEYBINDS);

    return (
        <div className={classes.container}>
            <div className={classes.layout}>
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
                        <div className={classes.listen}>
                            <Text className={classes.listenAction}>
                                {intl.formatMessage(KEYBIND_INTL[addToAction])}
                            </Text>
                            <Kbd className={classes.listenKey}>?</Kbd>
                            <Text c="dimmed" fw={700}>
                                <FormattedMessage
                                    defaultMessage={"Press any key..."}
                                    description={
                                        "Info text explaining to press any key to set a keybind for a game action"
                                    }
                                />
                            </Text>
                        </div>
                    </Modal>
                )}
                <div className={classes.column}>
                    <Panel
                        pop
                        icon={<IconUser size={24} stroke={2.4} />}
                        title={
                            <FormattedMessage
                                defaultMessage={"User Settings"}
                                description={"Title for a settings section used to modify user info used in-game"}
                            />
                        }
                    >
                        <NameEditor showTip={false} />
                    </Panel>
                    <Panel
                        pop
                        className={classes.delay2}
                        icon={<IconSitemap size={24} stroke={2.4} />}
                        title={
                            <FormattedMessage
                                defaultMessage={"Site Settings"}
                                description={"Title for a settings section used to modify general site settings"}
                            />
                        }
                    >
                        <Select
                            label="Select Locale"
                            value={settings.locale}
                            allowDeselect={false}
                            onChange={(_, item) => {
                                setSettings({
                                    ...settings,
                                    locale: (item?.value as KnownLocale) ?? getDefaultLocale(),
                                });
                            }}
                            data={KNOWN_LOCALE_DROPDOWN_VALUES}
                            placeholder="Choose locale"
                            leftSection={<LocaleFlag locale={settings.locale} />}
                            leftSectionWidth={46}
                            renderOption={({ option }) => (
                                <span className={classes.localeOption}>
                                    <LocaleFlag locale={option.value} />
                                    {option.label}
                                </span>
                            )}
                        />
                    </Panel>
                </div>
                <Panel
                    pop
                    className={classes.delay1}
                    icon={<IconDeviceGamepad2 size={26} stroke={2.4} />}
                    title={
                        <FormattedMessage
                            defaultMessage={"Control Settings"}
                            description={"Title for a settings section used to modify the keybinds used in-game"}
                        />
                    }
                >
                    <div className={classes.groups}>
                        {KEYBIND_GROUPS.map((group) => (
                            <section key={group.id} className={classes.group}>
                                <h3 className={classes.groupTitle}>{intl.formatMessage(group.title)}</h3>
                                <ul className={classes.binds}>
                                    {group.actions.map((action) => {
                                        const binds = settings.controls.filter((bind) => bind.action === action);
                                        const actionName = intl.formatMessage(KEYBIND_INTL[action]);
                                        return (
                                            <li key={action} className={classes.bind}>
                                                <span className={classes.action}>{actionName}</span>
                                                <span className={classes.keys}>
                                                    {binds.map((bind) => {
                                                        const count = settings.controls.filter(
                                                            (b) => b.key === bind.key,
                                                        ).length;
                                                        return (
                                                            <span
                                                                key={bind.key}
                                                                className={classes.keyChip}
                                                                data-conflict={count > 1 || undefined}
                                                            >
                                                                <Kbd className={classes.key}>{formatKey(bind.key)}</Kbd>
                                                                <button
                                                                    type="button"
                                                                    className={classes.unbind}
                                                                    onClick={() => removeKey(action, bind.key)}
                                                                    aria-label={intl.formatMessage(
                                                                        {
                                                                            defaultMessage:
                                                                                "Unbind {key} from {action}",
                                                                            description:
                                                                                "Accessible label for a button that removes one key from a game action",
                                                                        },
                                                                        {
                                                                            key: formatKey(bind.key),
                                                                            action: actionName,
                                                                        },
                                                                    )}
                                                                >
                                                                    <IconX size={12} stroke={3.5} />
                                                                </button>
                                                            </span>
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
                                                        <button
                                                            type="button"
                                                            className={classes.addKey}
                                                            onClick={() => addKey(action)}
                                                            aria-label={intl.formatMessage({
                                                                defaultMessage: "Add new key",
                                                                description:
                                                                    "Tooltip for a button used to add a new keybind for an action",
                                                            })}
                                                        >
                                                            <IconPlus size={14} stroke={3} />
                                                        </button>
                                                    </Tooltip>
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}
                    </div>
                    {controlsChanged && (
                        <Button
                            mt="lg"
                            color="copper"
                            onClick={resetControls}
                            rightSection={<IconRestore size={18} stroke={2.4} />}
                            className={classes.reset}
                        >
                            <FormattedMessage
                                defaultMessage={"Reset Controls"}
                                description={"Button used to reset user defined keybinds on the settings page"}
                            />
                        </Button>
                    )}
                </Panel>
            </div>
        </div>
    );
}
