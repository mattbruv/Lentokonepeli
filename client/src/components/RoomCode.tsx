import { ActionIcon, CopyButton, Loader } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import classes from "./RoomCode.module.css";

export function RoomCode({ code }: { code: string | null }) {
    if (!code) {
        return (
            <div className={classes.wrap}>
                <Loader type="dots" color="copper" />
            </div>
        );
    }

    return (
        <div className={classes.wrap}>
            <div className={classes.tiles}>
                {code.split("").map((char, i) => (
                    <span key={i} className={classes.tile} style={{ animationDelay: `${i * 70}ms` }}>
                        {char}
                    </span>
                ))}
            </div>
            <CopyButton value={code} timeout={1600}>
                {({ copied, copy }) => (
                    <ActionIcon
                        size="xl"
                        variant="filled"
                        color={copied ? "grass" : "sky"}
                        onClick={copy}
                        aria-label={code}
                    >
                        {copied ? <IconCheck stroke={3} /> : <IconCopy stroke={2.4} />}
                    </ActionIcon>
                )}
            </CopyButton>
        </div>
    );
}
