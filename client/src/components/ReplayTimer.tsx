import { Group, Slider, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { ticksToHHMMSS } from "../helpers";

type ReplayTimerProps = {
    currentTick: number;
    maxTicks: number;
    onScrub?: (tick: number) => void;
};

export function ReplayTimer({ currentTick, maxTicks, onScrub }: ReplayTimerProps) {
    const [scrubTick, setScrubTick] = useState(currentTick);
    const [isScrubbing, setIsScrubbing] = useState(false);

    useEffect(() => {
        if (!isScrubbing) setScrubTick(currentTick);
    }, [currentTick, isScrubbing]);

    return (
        <div>
            <Slider
                value={scrubTick}
                min={0}
                max={maxTicks}
                step={1}
                onChange={setScrubTick}
                onChangeEnd={(value) => {
                    setIsScrubbing(false);
                    onScrub?.(value);
                }}
                onPointerDown={() => setIsScrubbing(true)}
                styles={{ thumb: { width: 12, height: 12 } }}
            />
            <Group justify="space-between" mt={4}>
                <Text size="xs" c="dimmed">
                    {ticksToHHMMSS(scrubTick)}
                </Text>
                <Text size="xs" c="dimmed">
                    {ticksToHHMMSS(maxTicks)}
                </Text>
            </Group>
        </div>
    );
}
