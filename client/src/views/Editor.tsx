import { Button, Kbd } from "@mantine/core";
import { IconDownload, IconPuzzle } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormattedMessage } from "react-intl";
import { LevelEditor, MapPiece } from "../client/LevelEditor";
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
    const { settings } = useSettingsContext();
    const ref = useRef<HTMLDivElement>(null);
    const editor = useMemo(() => new LevelEditor(), []);
    const [world, setWorld] = useState(LevelEditor.initialWorldString(settings));
    const [rawInput, setRawInput] = useState(LevelEditor.initialWorldString(settings));

    const debounceTimeout = useRef<number | null>(null);

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
                    <textarea
                        value={rawInput}
                        onChange={handleChange}
                        className={style.code}
                        rows={10}
                        spellCheck={false}
                    />
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
