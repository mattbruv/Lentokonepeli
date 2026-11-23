import { ActionIcon, Slider, Tooltip } from "@mantine/core";
import {
    IconArrowLeftBar,
    IconArrowRightBar,
    IconChevronsLeft,
    IconChevronsRight,
    IconPlayerPauseFilled,
    IconPlayerPlayFilled,
    IconPlayerSkipBackFilled,
    IconPlayerSkipForwardFilled,
    IconPlayerTrackNextFilled,
    IconPlayerTrackPrevFilled,
} from "@tabler/icons-react";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { useEffect, useRef, useState } from "react";
import { ReplayCallbacks, ReplayInfo } from "src/hooks/useReplay";
import { ticksToHHMMSS } from "../helpers";
import { KeybindConfig } from "../hooks/keybinds/models";
import { registerKeybinds } from "../hooks/keybinds/registerKeybinds";
import classes from "./ReplayControls.module.css";

type ReplayTimerProps = {
    info: ReplayInfo;
    callbacks: ReplayCallbacks;
    summary: ReplaySummary;
};

export function ReplayTimer({ info, callbacks, summary }: ReplayTimerProps) {
    const [scrubTick, setScrubTick] = useState(info.tick);
    const [isScrubbing, setIsScrubbing] = useState(false);

    useEffect(() => {
        if (!isScrubbing) setScrubTick(info.tick);
    }, [info.tick, isScrubbing]);

    const latest = useRef({ callbacks, paused: info.paused });
    latest.current = { callbacks, paused: info.paused };

    useEffect(() => {
        const frames = { stepBack: -1, stepForward: 1, jumpBack: -10, jumpForward: 10 } as const;
        const keybinds: KeybindConfig<keyof typeof frames> = {
            keybinds: [
                { key: ",", action: "stepBack" },
                { key: ".", action: "stepForward" },
                { key: "<", action: "jumpBack" },
                { key: ">", action: "jumpForward" },
            ],
            callback: (action, type, event) => {
                if (type !== "down") return;
                const target = event.target as HTMLElement | null;
                if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
                event.preventDefault();
                const { callbacks, paused } = latest.current;
                const count = frames[action];
                if (count < 0) {
                    if (!event.repeat) callbacks.stepFrames(count);
                    return;
                }
                if (!paused) callbacks.setPaused(true);
                callbacks.stepFrames(count);
            },
        };
        return registerKeybinds(keybinds);
    }, []);

    return (
        <div className={classes.timer}>
            <div className={classes.clock}>
                <span className={classes.now}>{ticksToHHMMSS(info.tick)}</span>
                <span className={classes.total}>/ {ticksToHHMMSS(summary.total_ticks)}</span>
            </div>
            <Slider
                value={scrubTick}
                min={0}
                max={summary.total_ticks}
                step={1}
                onChange={setScrubTick}
                label={(e) => ticksToHHMMSS(e)}
                onChangeEnd={(value) => {
                    setIsScrubbing(false);
                    callbacks.playToTick(value);
                }}
                onPointerDown={() => setIsScrubbing(true)}
                color="sky"
                size="lg"
            />
            <div className={classes.transport}>
                <Tooltip label={"-30 seconds"}>
                    <ActionIcon variant="light" color={"copper"} onClick={(_) => callbacks.advanceSeconds(-30)}>
                        <IconPlayerTrackPrevFilled size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"-5 seconds"}>
                    <ActionIcon variant="light" color={"copper"} onClick={(_) => callbacks.advanceSeconds(-5)}>
                        <IconPlayerSkipBackFilled size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={info.paused ? "Play" : "Pause"}>
                    <ActionIcon
                        size={52}
                        variant="filled"
                        color={info.paused ? "grass" : "sky"}
                        onClick={(_) => callbacks.setPaused(!info.paused)}
                    >
                        {info.paused ? <IconPlayerPlayFilled size={26} /> : <IconPlayerPauseFilled size={26} />}
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"+5 seconds"}>
                    <ActionIcon variant="light" color={"copper"} onClick={(_) => callbacks.advanceSeconds(5)}>
                        <IconPlayerSkipForwardFilled size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"+30 seconds"}>
                    <ActionIcon variant="light" color={"copper"} onClick={(_) => callbacks.advanceSeconds(30)}>
                        <IconPlayerTrackNextFilled size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
            <div className={classes.frameStep}>
                <Tooltip label={"Back 10 frames (<)"}>
                    <ActionIcon
                        variant="light"
                        color={"gray"}
                        disabled={!info.paused || info.tick <= 0}
                        onClick={(_) => callbacks.stepFrames(-10)}
                    >
                        <IconChevronsLeft size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"Back one frame (,)"}>
                    <ActionIcon
                        variant="light"
                        color={"gray"}
                        disabled={!info.paused || info.tick <= 0}
                        onClick={(_) => callbacks.stepFrames(-1)}
                    >
                        <IconArrowLeftBar size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"Advance one frame (.)"}>
                    <ActionIcon
                        variant="light"
                        color={"gray"}
                        disabled={!info.paused || info.tick >= summary.total_ticks}
                        onClick={(_) => callbacks.stepFrames(1)}
                    >
                        <IconArrowRightBar size={18} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"Advance 10 frames (>)"}>
                    <ActionIcon
                        variant="light"
                        color={"gray"}
                        disabled={!info.paused || info.tick >= summary.total_ticks}
                        onClick={(_) => callbacks.stepFrames(10)}
                    >
                        <IconChevronsRight size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );
}
