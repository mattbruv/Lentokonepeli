import {
    ActionIcon,
    Badge,
    Button,
    Group,
    List,
    Modal,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Tabs,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {
    IconAdjustments,
    IconBuildingCastle,
    IconCopy,
    IconDeviceFloppy,
    IconPlane,
    IconRefresh,
    IconSwords,
    IconTrash,
    IconUserBolt,
} from "@tabler/icons-react";
import { GameRules } from "dogfight-types/GameRules";
import { PlaneRules } from "dogfight-types/PlaneRules";
import { PlaneRulesByType } from "dogfight-types/PlaneRulesByType";
import { FormEvent, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
    BooleanRule,
    BUILDING_RULES,
    BUILDING_TOGGLES,
    DAMAGE_RULES,
    defaultRules,
    deleteRulePreset,
    describeRuleChanges,
    formatRuleValue,
    fromDisplay,
    NumberRule,
    PLANE_RULES,
    PLANE_TYPES,
    planeName,
    PRESET_NAME_MAX_LENGTH,
    RESPAWN_RULES,
    RULE_MESSAGES,
    RuleUnit,
    sanitizeRules,
    saveRulePreset,
    toDisplay,
    useRulePresets,
    WEAPON_RULES,
} from "../rules";
import classes from "./RulesEditor.module.css";

function unitSuffix(unit: RuleUnit): string {
    if (unit === "percent") return "%";
    if (unit === "seconds") return " s";
    if (unit === "ms") return " ms";
    return "";
}

type RuleNumberInputProps = {
    label: string;
    unit: RuleUnit;
    min: number;
    max: number;
    step: number;
    value: number;
    original: number;
    onChange: (value: number) => void;
};

function RuleNumberInput({ label, unit, min, max, step, value, original, onChange }: RuleNumberInputProps) {
    const intl = useIntl();
    const changed = value !== original;
    return (
        <NumberInput
            label={label}
            inputWrapperOrder={["label", "input", "description"]}
            classNames={{ input: changed ? classes.changed : undefined }}
            description={
                changed
                    ? intl.formatMessage(RULE_MESSAGES.original_value, {
                          value: formatRuleValue(intl, unit, original),
                      })
                    : undefined
            }
            min={toDisplay(unit, min)}
            max={toDisplay(unit, max)}
            step={toDisplay(unit, step)}
            decimalScale={unit === "seconds" ? 2 : 0}
            suffix={unitSuffix(unit)}
            clampBehavior="strict"
            value={toDisplay(unit, value)}
            onChange={(next) => {
                if (typeof next === "number" && Number.isFinite(next)) onChange(fromDisplay(unit, next));
            }}
        />
    );
}

function RuleSwitches({
    rules,
    value,
    original,
    onChange,
}: {
    rules: BooleanRule[];
    value: GameRules;
    original: GameRules;
    onChange: (rules: GameRules) => void;
}) {
    const intl = useIntl();
    return (
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm" verticalSpacing="sm">
            {rules.map((rule) => (
                <Switch
                    key={rule.key}
                    color="grass"
                    label={intl.formatMessage(rule.label)}
                    classNames={{ label: value[rule.key] !== original[rule.key] ? classes.changedLabel : undefined }}
                    checked={value[rule.key]}
                    onChange={(event) => onChange({ ...value, [rule.key]: event.currentTarget.checked })}
                />
            ))}
        </SimpleGrid>
    );
}

function RuleNumbers({
    rules,
    value,
    original,
    onChange,
}: {
    rules: NumberRule<keyof GameRules>[];
    value: GameRules;
    original: GameRules;
    onChange: (rules: GameRules) => void;
}) {
    const intl = useIntl();
    return (
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            {rules.map((rule) => (
                <RuleNumberInput
                    key={rule.key}
                    label={intl.formatMessage(rule.label)}
                    unit={rule.unit}
                    min={rule.min}
                    max={rule.max}
                    step={rule.step}
                    value={value[rule.key] as number}
                    original={original[rule.key] as number}
                    onChange={(next) => onChange({ ...value, [rule.key]: next })}
                />
            ))}
        </SimpleGrid>
    );
}

function PlanesTab({
    value,
    original,
    onChange,
}: {
    value: GameRules;
    original: GameRules;
    onChange: (rules: GameRules) => void;
}) {
    const intl = useIntl();
    const [selected, setSelected] = useState<keyof PlaneRulesByType>("albatros");
    const plane = value.planes[selected];
    const base = original.planes[selected];

    function updatePlane(next: PlaneRules) {
        onChange({ ...value, planes: { ...value.planes, [selected]: next } });
    }

    function copyToAll() {
        const planes = Object.fromEntries(
            PLANE_TYPES.map(({ key }) => [key, { ...plane, allowed: value.planes[key].allowed }]),
        ) as unknown as PlaneRulesByType;
        onChange({ ...value, planes });
    }

    return (
        <Stack gap="md">
            <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="xs">
                {PLANE_TYPES.map(({ key, type }) => (
                    <Button
                        key={key}
                        size="xs"
                        color="sky"
                        variant={key === selected ? "filled" : "default"}
                        className={value.planes[key].allowed ? undefined : classes.disallowed}
                        onClick={() => setSelected(key)}
                    >
                        {planeName(intl, type)}
                    </Button>
                ))}
            </SimpleGrid>
            <Group justify="space-between">
                <Switch
                    color="grass"
                    label={intl.formatMessage(RULE_MESSAGES.allowed)}
                    checked={plane.allowed}
                    onChange={(event) => updatePlane({ ...plane, allowed: event.currentTarget.checked })}
                />
                <Button
                    variant="default"
                    size="xs"
                    leftSection={<IconCopy size={14} stroke={2.2} />}
                    onClick={copyToAll}
                >
                    <FormattedMessage
                        defaultMessage="Copy to all planes"
                        description="Rules editor button that copies the selected plane's values to every plane"
                    />
                </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
                {PLANE_RULES.map((rule) => (
                    <RuleNumberInput
                        key={rule.key}
                        label={intl.formatMessage(rule.label)}
                        unit={rule.unit}
                        min={rule.min}
                        max={rule.max}
                        step={rule.step}
                        value={plane[rule.key]}
                        original={base[rule.key]}
                        onChange={(next) => updatePlane({ ...plane, [rule.key]: next })}
                    />
                ))}
            </SimpleGrid>
            <span className={classes.hint}>
                <FormattedMessage
                    defaultMessage="Each team always keeps at least one allowed plane."
                    description="Hint in the rules editor plane tab explaining that a team cannot have every plane disabled"
                />
            </span>
        </Stack>
    );
}

function PresetBar({ value, onChange }: { value: GameRules; onChange: (rules: GameRules) => void }) {
    const intl = useIntl();
    const presets = useRulePresets();
    const names = useMemo(
        () => Object.keys(presets).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
        [presets],
    );
    const [name, setName] = useState("");
    const current = useMemo(() => JSON.stringify(sanitizeRules(value)), [value]);
    const selected = names.find((preset) => JSON.stringify(presets[preset]) === current) ?? null;

    function save(event: FormEvent) {
        event.preventDefault();
        if (saveRulePreset(name, value)) setName("");
    }

    return (
        <div className={classes.presets}>
            <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                    className={classes.grow}
                    label={intl.formatMessage({
                        defaultMessage: "Preset",
                        description: "Label for the saved game rule preset picker",
                    })}
                    placeholder={intl.formatMessage({
                        defaultMessage: "No saved presets",
                        description: "Placeholder for the rule preset picker when nothing is selected or saved",
                    })}
                    data={names}
                    value={selected}
                    allowDeselect={false}
                    disabled={names.length === 0}
                    onChange={(next) => {
                        if (next && presets[next]) onChange(sanitizeRules(presets[next]));
                    }}
                />
                <Tooltip
                    label={intl.formatMessage({
                        defaultMessage: "Delete preset",
                        description: "Tooltip for the button that deletes the selected rule preset",
                    })}
                >
                    <ActionIcon
                        variant="default"
                        size="lg"
                        disabled={!selected}
                        onClick={() => {
                            if (selected) deleteRulePreset(selected);
                        }}
                        aria-label={intl.formatMessage({
                            defaultMessage: "Delete preset",
                            description: "Tooltip for the button that deletes the selected rule preset",
                        })}
                    >
                        <IconTrash size={18} stroke={2.2} />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <form onSubmit={save}>
                <Group gap="xs" align="flex-end" wrap="nowrap">
                    <TextInput
                        className={classes.grow}
                        label={intl.formatMessage({
                            defaultMessage: "Save current rules as",
                            description: "Label for the input naming a new rule preset",
                        })}
                        placeholder={intl.formatMessage({
                            defaultMessage: "Preset name",
                            description: "Placeholder for the rule preset name input",
                        })}
                        maxLength={PRESET_NAME_MAX_LENGTH}
                        value={name}
                        onChange={(event) => setName(event.currentTarget.value)}
                    />
                    <Button
                        type="submit"
                        variant="default"
                        disabled={!name.trim()}
                        leftSection={<IconDeviceFloppy size={16} stroke={2.2} />}
                    >
                        <FormattedMessage
                            defaultMessage="Save"
                            description="Button that saves the current game rules as a named preset"
                        />
                    </Button>
                </Group>
            </form>
        </div>
    );
}

export function RulesEditor({ value, onChange }: { value: GameRules; onChange: (rules: GameRules) => void }) {
    const intl = useIntl();
    const original = useMemo(() => defaultRules(), []);

    return (
        <Stack gap="md">
            <PresetBar value={value} onChange={onChange} />
            <Tabs defaultValue="weapons" keepMounted={false}>
                <Tabs.List grow mb="md">
                    <Tabs.Tab value="weapons" leftSection={<IconSwords size={16} stroke={2.2} />}>
                        {intl.formatMessage({
                            defaultMessage: "Weapons",
                            description: "Rules editor tab for weapon and combat rules",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="planes" leftSection={<IconPlane size={16} stroke={2.2} />}>
                        {intl.formatMessage({
                            defaultMessage: "Planes",
                            description: "Rules editor tab for per-plane values",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="buildings" leftSection={<IconBuildingCastle size={16} stroke={2.2} />}>
                        {intl.formatMessage({
                            defaultMessage: "Buildings",
                            description: "Rules editor tab for runway and headquarters rules",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="respawn" leftSection={<IconUserBolt size={16} stroke={2.2} />}>
                        {intl.formatMessage({
                            defaultMessage: "Respawn & pilots",
                            description: "Rules editor tab for respawn timers and pilot rules",
                        })}
                    </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="weapons">
                    <Stack gap="lg">
                        <RuleSwitches rules={WEAPON_RULES} value={value} original={original} onChange={onChange} />
                        <RuleNumbers rules={DAMAGE_RULES} value={value} original={original} onChange={onChange} />
                    </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="planes">
                    <PlanesTab value={value} original={original} onChange={onChange} />
                </Tabs.Panel>
                <Tabs.Panel value="buildings">
                    <Stack gap="lg">
                        <RuleSwitches rules={BUILDING_TOGGLES} value={value} original={original} onChange={onChange} />
                        <RuleNumbers rules={BUILDING_RULES} value={value} original={original} onChange={onChange} />
                    </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="respawn">
                    <RuleNumbers rules={RESPAWN_RULES} value={value} original={original} onChange={onChange} />
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}

export function RuleChangesList({ rules }: { rules: GameRules }) {
    const intl = useIntl();
    const changes = useMemo(() => describeRuleChanges(intl, rules), [intl, rules]);
    if (changes.length === 0) return null;
    return (
        <List size="sm" spacing={2} className={classes.changes}>
            {changes.map((change) => (
                <List.Item key={change}>{change}</List.Item>
            ))}
        </List>
    );
}

export function RulesField({ value, onChange }: { value: GameRules; onChange: (rules: GameRules) => void }) {
    const intl = useIntl();
    const [opened, setOpened] = useState(false);
    const [draft, setDraft] = useState<GameRules>(value);
    const changes = useMemo(() => describeRuleChanges(intl, value).length, [intl, value]);

    function open() {
        setDraft(value);
        setOpened(true);
    }

    function apply() {
        onChange(sanitizeRules(draft));
        setOpened(false);
    }

    return (
        <>
            <Button
                variant="default"
                fullWidth
                onClick={open}
                leftSection={<IconAdjustments size={18} stroke={2.2} />}
                rightSection={
                    changes > 0 ? (
                        <Badge color="copper" variant="filled" size="sm">
                            {changes}
                        </Badge>
                    ) : undefined
                }
            >
                {changes > 0
                    ? intl.formatMessage({
                          defaultMessage: "Custom game rules",
                          description: "Button label when the host has changed the game rules from the original game",
                      })
                    : intl.formatMessage({
                          defaultMessage: "Original game rules",
                          description: "Button label when the game rules match the original game",
                      })}
            </Button>
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                size="xl"
                centered
                title={
                    <span className={classes.title}>
                        <IconAdjustments size={22} stroke={2.4} />
                        <FormattedMessage
                            defaultMessage="Game rules"
                            description="Title of the dialog for editing advanced game rules"
                        />
                    </span>
                }
            >
                <Stack gap="lg">
                    <RulesEditor value={draft} onChange={setDraft} />
                    <Group justify="space-between">
                        <Button
                            variant="subtle"
                            color="red"
                            leftSection={<IconRefresh size={16} stroke={2.2} />}
                            onClick={() => setDraft(defaultRules())}
                        >
                            <FormattedMessage
                                defaultMessage="Reset to original"
                                description="Rules editor button that restores every rule to the original game's value"
                            />
                        </Button>
                        <Group gap="xs">
                            <Button variant="default" onClick={() => setOpened(false)}>
                                <FormattedMessage
                                    defaultMessage="Cancel"
                                    description="Rules editor button that discards rule changes"
                                />
                            </Button>
                            <Button color="copper" onClick={apply}>
                                <FormattedMessage
                                    defaultMessage="Apply"
                                    description="Rules editor button that keeps the edited rules"
                                />
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
