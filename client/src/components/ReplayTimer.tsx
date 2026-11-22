import { ActionIcon, Slider, Tooltip } from "@mantine/core";
import {
    IconArrowRightBar,
    IconPlayerPauseFilled,
    IconPlayerPlayFilled,
    IconPlayerSkipBackFilled,
    IconPlayerSkipForwardFilled,
    IconPlayerTrackNextFilled,
    IconPlayerTrackPrevFilled,
} from "@tabler/icons-react";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { useEffect, useState } from "react";
import { ReplayCallbacks, ReplayInfo } from "src/hooks/useReplay";
import { ticksToHHMMSS } from "../helpers";
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
                <Tooltip label={"Advance one frame"}>
                    <ActionIcon
                        variant="light"
                        color={"gray"}
                        disabled={!info.paused}
                        onClick={(_) => callbacks.advanceOneTick()}
                    >
                        <IconArrowRightBar size={18} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );
}
