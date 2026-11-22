import { ActionIcon, Button, Kbd, Modal, Select, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceGamepad2, IconPlus, IconRestore, IconSitemap, IconTrash, IconUser } from "@tabler/icons-react";
import React, { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NameEditor } from "../components/NameEditor";
import { LocaleFlag } from "../components/ui/LocaleFlag";
import { Panel } from "../components/ui/Panel";
import { DEFAULT_GAME_KEYBINDS, useSettingsContext } from "../contexts/settingsContext";
import { GameAction } from "../hooks/keybinds/models";
import { getDefaultLocale, KNOWN_LOCALE_DROPDOWN_VALUES, KnownLocale } from "../intl/IntlProvider";
import { KEYBIND_INTL } from "../intl/messages";
import classes from "./Settings.module.css";

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

    const controlsChanged = JSON.stringify(settings.controls) !== JSON.stringify(DEFAULT_GAME_KEYBINDS);

    return (
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
                        <Text className={classes.listenAction}>{intl.formatMessage(KEYBIND_INTL[addToAction])}</Text>
                        <Kbd className={classes.listenKey}>?</Kbd>
                        <Text c="dimmed" fw={700}>
                            <FormattedMessage
                                defaultMessage={"Press any key..."}
                                description={"Info text explaining to press any key to set a keybind for a game action"}
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
                <ul className={classes.binds}>
                    {Object.entries(KEYBIND_INTL).map(([action, descriptor]) => {
                        const binds = settings.controls.filter((bind) => bind.action === action);
                        return (
                            <li key={action} className={classes.bind}>
                                <span className={classes.action}>{intl.formatMessage(descriptor)}</span>
                                <span className={classes.keys}>
                                    {binds.map((bind) => {
                                        const count = settings.controls.filter((b) => b.key === bind.key).length;
                                        return (
                                            <Kbd
                                                key={bind.key}
                                                className={classes.key}
                                                data-conflict={count > 1 || undefined}
                                            >
                                                {bind.key === " " ? "Space" : bind.key}
                                            </Kbd>
                                        );
                                    })}
                                </span>
                                <span className={classes.bindActions}>
                                    <Tooltip
                                        openDelay={250}
                                        label={intl.formatMessage({
                                            defaultMessage: "Add new key",
                                            description: "Tooltip for a button used to add a new keybind for an action",
                                        })}
                                    >
                                        <ActionIcon
                                            onClick={() => addKey(action as GameAction)}
                                            color={"grass"}
                                            variant={"light"}
                                            size="md"
                                        >
                                            <IconPlus size={16} stroke={3} />
                                        </ActionIcon>
                                    </Tooltip>
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
                                            color={"cherry"}
                                            variant={"light"}
                                            size="md"
                                            disabled={binds.length === 0}
                                        >
                                            <IconTrash size={16} stroke={2.4} />
                                        </ActionIcon>
                                    </Tooltip>
                                </span>
                            </li>
                        );
                    })}
                </ul>
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
    );
}
