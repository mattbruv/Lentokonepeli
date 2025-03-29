import { Button, Flex, Kbd, Stack, Title } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormattedMessage } from "react-intl";
import { LevelEditor, MapPiece } from "../client/LevelEditor";
import { EditorNotice } from "../components/EditorNotice";
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

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRawInput(event.target.value);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => setWorld(LevelEditor.sanitizeWorldString(world)), 300);
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
        <Stack align={"center"}>
            <EditorNotice />
            <Flex className={style.editor} direction={"column"} wrap="wrap" gap="md" align={"center"}>
                <Flex wrap="wrap" gap={"lg"} justify={"center"}>
                    <Stack gap="sm">
                        <textarea value={rawInput} onChange={handleChange} className={style.code} rows={10} cols={70} />
                        <Button onClick={() => saveAsFile(world)}>Save as file</Button>
                    </Stack>
                    <div ref={ref}></div>
                </Flex>

                <Stack align="start">
                    <Title order={3}>
                        <FormattedMessage
                            defaultMessage={"Supported pieces"}
                            description={"supported pieces to be used in level editor"}
                        />
                    </Title>
                    <Flex gap={"xs"} wrap={"wrap"} justify={"start"}>
                        {Object.entries(MapPiece).map(([name, char]) => (
                            <pre key={char} className={style.piece}>
                                <Kbd>{char}</Kbd> {name}
                            </pre>
                        ))}
                    </Flex>
                </Stack>
            </Flex>
        </Stack>
    );
};
