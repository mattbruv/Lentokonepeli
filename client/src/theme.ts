import {
    ActionIcon,
    Button,
    createTheme,
    CSSVariablesResolver,
    Input,
    Kbd,
    MantineColorsTuple,
    Modal,
    MultiSelect,
    PinInput,
    SegmentedControl,
    Select,
    Slider,
    Switch,
    TextInput,
    Tooltip,
} from "@mantine/core";
import classes from "./theme.module.css";

const sky: MantineColorsTuple = [
    "#e6f4ff",
    "#cfe5ff",
    "#9ec8fb",
    "#6aaaf7",
    "#3f90f3",
    "#2480f1",
    "#1272e0",
    "#0563c9",
    "#0058b4",
    "#004c9f",
];

const grass: MantineColorsTuple = [
    "#effbe7",
    "#dff3d1",
    "#bde6a3",
    "#99d872",
    "#7acc49",
    "#66c430",
    "#4fb01f",
    "#3a9b14",
    "#2f8a0c",
    "#1f7700",
];

const copper: MantineColorsTuple = [
    "#fff1e6",
    "#fbe0cf",
    "#f3bf9f",
    "#ec9c6c",
    "#e57e41",
    "#e16b26",
    "#c85a17",
    "#a84b11",
    "#8a3d12",
    "#6e2e0c",
];

const cherry: MantineColorsTuple = [
    "#ffe9ee",
    "#ffd1da",
    "#fba1b1",
    "#f66d86",
    "#f24262",
    "#f0274b",
    "#e0173d",
    "#c70a32",
    "#b2002b",
    "#990033",
];

export const theme = createTheme({
    primaryColor: "sky",
    primaryShade: { light: 6, dark: 5 },
    colors: { sky, grass, copper, cherry },
    fontFamily: "Nunito, system-ui, sans-serif",
    fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
    headings: { fontFamily: "Fredoka, Nunito, system-ui, sans-serif", fontWeight: "600" },
    defaultRadius: "md",
    cursorType: "pointer",
    components: {
        Button: Button.extend({
            defaultProps: { radius: "xl" },
            classNames: { root: classes.button },
        }),
        ActionIcon: ActionIcon.extend({
            defaultProps: { radius: "xl", size: "lg" },
            classNames: { root: classes.actionIcon },
        }),
        Input: Input.extend({ classNames: { input: classes.input } }),
        TextInput: TextInput.extend({ classNames: { label: classes.label, description: classes.description } }),
        Select: Select.extend({
            classNames: { label: classes.label, dropdown: classes.dropdown, option: classes.option },
        }),
        MultiSelect: MultiSelect.extend({
            classNames: {
                label: classes.label,
                dropdown: classes.dropdown,
                option: classes.option,
                pill: classes.pill,
            },
        }),
        PinInput: PinInput.extend({ classNames: { input: classes.pinInput } }),
        Kbd: Kbd.extend({ classNames: { root: classes.kbd } }),
        Modal: Modal.extend({
            defaultProps: { radius: "lg", centered: true },
            classNames: { content: classes.modalContent, header: classes.modalHeader, title: classes.modalTitle },
        }),
        Tooltip: Tooltip.extend({
            defaultProps: { radius: "md", withArrow: true },
            classNames: { tooltip: classes.tooltip },
        }),
        SegmentedControl: SegmentedControl.extend({
            defaultProps: { radius: "xl" },
            classNames: {
                root: classes.segmented,
                indicator: classes.segmentedIndicator,
                label: classes.segmentedLabel,
            },
        }),
        Slider: Slider.extend({ classNames: { track: classes.sliderTrack, thumb: classes.sliderThumb } }),
        Switch: Switch.extend({ classNames: { track: classes.switchTrack } }),
    },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
    variables: {},
    light: {
        "--mantine-color-body": "#fffdf8",
        "--mantine-color-text": "#2e1a0e",
        "--mantine-color-dimmed": "#8a6a52",
        "--mantine-color-placeholder": "#8a6a52",
        "--mantine-color-default-border": "#b48f6e",
    },
    dark: {
        "--mantine-color-body": "#1b2124",
        "--mantine-color-text": "#eaf0f3",
        "--mantine-color-dimmed": "#93a3ac",
        "--mantine-color-placeholder": "#93a3ac",
        "--mantine-color-default-border": "#55636b",
    },
});
