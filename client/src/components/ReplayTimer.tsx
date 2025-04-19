import { Button, Group, Slider, Stack, Text } from "@mantine/core";
import { ReplaySummary } from "dogfight-types/ReplaySummary";
import { useState } from "react";
import { ReplayCallbacks, ReplayInfo } from "src/hooks/useReplay";
import { ticksToHHMMSS } from "../helpers";

type ReplayTimerProps = {
    info: ReplayInfo;
    callbacks: ReplayCallbacks;
    summary: ReplaySummary;
};

export function ReplayTimer({ info, callbacks, summary }: ReplayTimerProps) {
    const [isScrubbing, setIsScrubbing] = useState(false);

    return (
        <Stack>
            <div>
                <Slider
                    value={info.tick}
                    min={0}
                    max={summary.total_ticks}
                    step={1}
                    onChange={callbacks.playToTick}
                    label={(e) => ticksToHHMMSS(e)}
                    onChangeEnd={(value) => {
                        //    setIsScrubbing(false);
                        //   onScrub?.(value);
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
                <Button>{info.paused ? "play" : "pause"}</Button>
            </div>
        </Stack>
    );
}
