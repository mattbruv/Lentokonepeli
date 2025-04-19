import { Button, Group, Slider, Stack, Text } from "@mantine/core";
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
            <div>
                <Button onClick={(_) => callbacks.setPaused(!info.paused)}>{info.paused ? "play" : "pause"}</Button>
            </div>
        </Stack>
    );
}
