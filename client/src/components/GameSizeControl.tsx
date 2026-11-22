import { ActionIcon, Button, Slider, Tooltip } from "@mantine/core";
import { IconArrowsMinimize, IconMinus, IconPlus, IconResize } from "@tabler/icons-react";
import { RefObject, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { VIEW_WIDTH } from "../client/constants";
import { useSettingsContext } from "../contexts/settingsContext";
import classes from "./GameSizeControl.module.css";
import { Panel } from "./ui/Panel";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const STEP = 0.05;
const BEZEL_INSET = 18;

const round = (value: number) => Number((Math.round(value / STEP) * STEP).toFixed(2));

export function GameSizeControl({ stage }: { stage: RefObject<HTMLDivElement> }) {
    const intl = useIntl();
    const { settings, setSettings } = useSettingsContext();
    const [shownScale, setShownScale] = useState(1);
    const [maxScale, setMaxScale] = useState(MAX_SCALE);

    useEffect(() => {
        const bezel = stage.current;
        const container = bezel?.parentElement;
        if (!bezel || !container) return;

        const measure = () => {
            const canvas = bezel.querySelector(".lk-game canvas");
            if (canvas) setShownScale(canvas.getBoundingClientRect().width / VIEW_WIDTH);
            const available = (container.clientWidth - BEZEL_INSET) / VIEW_WIDTH;
            setMaxScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.floor(available / STEP) * STEP)));
        };

        const observer = new ResizeObserver(measure);
        observer.observe(container);
        bezel.querySelectorAll(".lk-game").forEach((el) => observer.observe(el));
        measure();
        return () => observer.disconnect();
    }, [stage]);

    const isFit = settings.gameScale === null;
    const value = Math.min(maxScale, settings.gameScale ?? round(shownScale));

    function setScale(scale: number | null) {
        setSettings((prev) => ({
            ...prev,
            gameScale: scale === null ? null : Math.min(maxScale, Math.max(MIN_SCALE, round(scale))),
        }));
    }

    return (
        <Panel
            icon={<IconResize size={24} stroke={2.4} />}
            title={
                <FormattedMessage
                    defaultMessage="Game size"
                    description="Title of the panel used to resize the game view"
                />
            }
        >
            <div className={classes.control}>
                <div className={classes.readout}>{Math.round(shownScale * 100)}%</div>
                <div className={classes.row}>
                    <Tooltip
                        label={intl.formatMessage({
                            defaultMessage: "Smaller",
                            description: "Tooltip for the button that makes the game view smaller",
                        })}
                    >
                        <ActionIcon
                            variant="light"
                            color="copper"
                            size="md"
                            onClick={() => setScale(value - 0.1)}
                            disabled={value <= MIN_SCALE}
                        >
                            <IconMinus size={16} stroke={3} />
                        </ActionIcon>
                    </Tooltip>
                    <Slider
                        className={classes.slider}
                        value={value}
                        min={MIN_SCALE}
                        max={maxScale}
                        step={STEP}
                        onChange={setScale}
                        label={(v) => `${Math.round(v * 100)}%`}
                        color="sky"
                        size="lg"
                    />
                    <Tooltip
                        label={intl.formatMessage({
                            defaultMessage: "Bigger",
                            description: "Tooltip for the button that makes the game view bigger",
                        })}
                    >
                        <ActionIcon
                            variant="light"
                            color="copper"
                            size="md"
                            onClick={() => setScale(value + 0.1)}
                            disabled={value >= maxScale}
                        >
                            <IconPlus size={16} stroke={3} />
                        </ActionIcon>
                    </Tooltip>
                </div>
                <Button
                    variant="light"
                    color="sky"
                    size="sm"
                    fullWidth
                    disabled={isFit}
                    onClick={() => setScale(null)}
                    rightSection={<IconArrowsMinimize size={16} stroke={2.4} />}
                >
                    <FormattedMessage
                        defaultMessage="Fit to window"
                        description="Button that resets the game view size so it fits the browser window"
                    />
                </Button>
            </div>
        </Panel>
    );
}
