import { ActionIcon, Group, Slider, Stack, Text, Tooltip } from "@mantine/core";
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
        <Stack>
            <div>
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
                    styles={{ thumb: { width: 12, height: 12 } }}
                />
                <Group justify="space-between" mt={4}>
                    <Text size="xs" c="dimmed">
                        {ticksToHHMMSS(info.tick)}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {ticksToHHMMSS(summary.total_ticks)}
                    </Text>
                </Group>
            </div>
            <Group gap={4}>
                <Tooltip label={"-30 seconds"}>
                    <ActionIcon color={"grape"} onClick={(_) => callbacks.advanceSeconds(-30)}>
                        <IconPlayerTrackPrevFilled />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"-5 seconds"}>
                    <ActionIcon color={"grape"} onClick={(_) => callbacks.advanceSeconds(-5)}>
                        <IconPlayerSkipBackFilled />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={info.paused ? "Play" : "Pause"}>
                    <ActionIcon onClick={(_) => callbacks.setPaused(!info.paused)}>
                        {info.paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}
                    </ActionIcon>
                </Tooltip>
                {info.paused && (
                    <Tooltip label={"Advance one frame"}>
                        <ActionIcon color={"gray"} onClick={(_) => callbacks.advanceOneTick()}>
                            <IconArrowRightBar />
                        </ActionIcon>
                    </Tooltip>
                )}
                <Tooltip label={"+5 seconds"}>
                    <ActionIcon color={"grape"} onClick={(_) => callbacks.advanceSeconds(5)}>
                        <IconPlayerSkipForwardFilled />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label={"+30 seconds"}>
                    <ActionIcon color={"grape"} onClick={(_) => callbacks.advanceSeconds(30)}>
                        <IconPlayerTrackNextFilled />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Group></Group>
        </Stack>
    );
}
