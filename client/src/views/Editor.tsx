import { ActionIcon, Button, Group, Kbd, Select } from "@mantine/core";
import { IconDeviceFloppy, IconDownload, IconPuzzle, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormattedMessage, useIntl } from "react-intl";
import { LevelEditor, MapPiece } from "../client/LevelEditor";
import { customLevelName, deleteCustomLevel, saveCustomLevel, useCustomLevels } from "../customLevels";
import { Panel } from "../components/ui/Panel";
import { useSettingsContext } from "../contexts/settingsContext";
import style from "./Editor.module.css";

const saveAsFile = (world: string) => {
    const blob = new Blob([world], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = LevelEditor.worldDownloadFileName(world);
    a.click();
    URL.revokeObjectURL(url);
};

export const Editor = () => {
    const intl = useIntl();
    const { settings } = useSettingsContext();
    const customLevels = useCustomLevels();
    const [selectedCustom, setSelectedCustom] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const editor = useMemo(() => new LevelEditor(), []);
    const [world, setWorld] = useState(LevelEditor.initialWorldString(settings));
    const [rawInput, setRawInput] = useState(LevelEditor.initialWorldString(settings));

    const debounceTimeout = useRef<number | null>(null);
    const savedTimeout = useRef<number | null>(null);

    const loadWorld = (newWorld: string) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        setRawInput(newWorld);
        setWorld(LevelEditor.sanitizeWorldString(newWorld));
    };

    const saveToMyLevels = () => {
        const sanitized = LevelEditor.sanitizeWorldString(rawInput);
        loadWorld(sanitized);
        if (!saveCustomLevel(sanitized)) return;
        setSelectedCustom(customLevelName(sanitized));
        setSaved(true);
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
        savedTimeout.current = window.setTimeout(() => setSaved(false), 2000);
    };

    const deleteSelected = () => {
        if (!selectedCustom) return;
        deleteCustomLevel(selectedCustom);
        setSelectedCustom(null);
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newRawInput = event.target.value;
        setRawInput(newRawInput);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = window.setTimeout(() => {
            const sanitized = LevelEditor.sanitizeWorldString(newRawInput);
            setWorld(sanitized);
        }, 300);
    };

    useEffect(() => {
        if (!ref.current) return;
        editor.init(ref.current);
    }, [ref]);

    useEffect(() => {
        if (!world) return;
        editor.render(world);
    }, [world]);

    useEffect(
        () => () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
            if (savedTimeout.current) {
                clearTimeout(savedTimeout.current);
            }
            editor.destroy();
        },
        [],
    );

    return (
        <div className={style.layout}>
            <div className={style.workspace}>
                <div className={style.preview}>
                    <div ref={ref} className={style.canvas}></div>
                </div>
                <Panel className={style.codePanel} bodyClassName={style.codeBody}>
                    <Group gap="xs" wrap="nowrap" align="flex-end">
                        <Select
                            className={style.grow}
                            label={intl.formatMessage({
                                defaultMessage: "My levels",
                                description: "Label for selection in the level editor used to open a saved level",
                            })}
                            placeholder={intl.formatMessage({
                                defaultMessage: "Open a saved level...",
                                description: "Placeholder for selection in the level editor used to open a saved level",
                            })}
                            data={Object.keys(customLevels)}
                            value={selectedCustom && selectedCustom in customLevels ? selectedCustom : null}
                            searchable
                            onChange={(name) => {
                                setSelectedCustom(name);
                                if (name && customLevels[name]) loadWorld(customLevels[name]);
                            }}
                        />
                        <ActionIcon
                            size="input-sm"
                            color="red"
                            disabled={!selectedCustom || !(selectedCustom in customLevels)}
                            onClick={deleteSelected}
                            aria-label={intl.formatMessage({
                                defaultMessage: "Delete saved level",
                                description:
                                    "Accessible label for button in the level editor that deletes a saved level",
                            })}
                        >
                            <IconTrash size={18} stroke={2.4} />
                        </ActionIcon>
                    </Group>
                    <textarea
                        value={rawInput}
                        onChange={handleChange}
                        className={style.code}
                        rows={10}
                        spellCheck={false}
                    />
                    <Button
                        color="sky"
                        fullWidth
                        disabled={!customLevelName(rawInput)}
                        onClick={saveToMyLevels}
                        rightSection={<IconDeviceFloppy size={18} stroke={2.4} />}
                    >
                        {saved ? (
                            <FormattedMessage
                                defaultMessage={"Saved!"}
                                description={"Button text shown briefly after a level is saved to my levels"}
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage={"Save to my levels"}
                                description={"Button text in the level editor that saves the level so it can be hosted"}
                            />
                        )}
                    </Button>
                    <Button
                        color="grass"
                        fullWidth
                        onClick={() => saveAsFile(world)}
                        rightSection={<IconDownload size={18} stroke={2.4} />}
                    >
                        Save as file
                    </Button>
                </Panel>
            </div>
            <Panel
                icon={<IconPuzzle size={24} stroke={2.4} />}
                title={
                    <FormattedMessage
                        defaultMessage={"Supported pieces"}
                        description={"supported pieces to be used in level editor"}
                    />
                }
            >
                <div className={style.pieces}>
                    {Object.entries(MapPiece).map(([name, char]) => (
                        <div key={char} className={style.piece}>
                            <Kbd>{char}</Kbd>
                            <span>{name}</span>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    );
};
