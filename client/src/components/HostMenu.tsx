import {
    ActionIcon,
    Button,
    Checkbox,
    Group,
    Modal,
    NumberInput,
    SegmentedControl,
    Select,
    Stack,
    Tabs,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {
    IconDeviceFloppy,
    IconMap,
    IconRefresh,
    IconPlayerSkipForward,
    IconRobot,
    IconSettings,
    IconTrash,
    IconUserMinus,
    IconUserPlus,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import { BotInfo } from "dogfight-types/BotInfo";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { Team } from "dogfight-types/Team";
import { WorldState } from "dogfight-types/WorldState";
import { FormEvent, useEffect, useState } from "react";
import { defineMessages, FormattedMessage, IntlShape, useIntl } from "react-intl";
import { BOT_WARNING_THRESHOLD, BotDifficultyChoice, DIFFICULTIES, LOBBY_NAME_MAX_LENGTH } from "../hooks/useLocalHost";
import { GameSettings, GameSettingsFields } from "./GameSettingsFields";
import classes from "./HostMenu.module.css";

type TeamChoice = Team | "Random";

const FLAGS: Record<TeamChoice, string> = {
    Centrals: "images/germanflag_small.gif",
    Allies: "images/raf_flag_small.gif",
    Random: "images/randomflag_small.gif",
};

export const BOT_MESSAGES = defineMessages({
    Centrals: { defaultMessage: "Centrals", description: "Bot panel: option to add a bot to the Centrals team" },
    Random: { defaultMessage: "Random", description: "Bot panel: option to add a bot to whichever team needs players" },
    Allies: { defaultMessage: "Allies", description: "Bot panel: option to add a bot to the Allies team" },
    Passive: { defaultMessage: "Passive", description: "Bot panel: bot difficulty that never shoots or bombs" },
    Easy: { defaultMessage: "Easy", description: "Bot panel: easiest bot difficulty" },
    Medium: { defaultMessage: "Medium", description: "Bot panel: medium bot difficulty" },
    Hard: { defaultMessage: "Hard", description: "Bot panel: hard bot difficulty" },
    Ace: { defaultMessage: "Ace", description: "Bot panel: hardest bot difficulty" },
    RandomDifficulty: {
        defaultMessage: "Random",
        description: "Bot panel: difficulty option that gives each added bot a random difficulty",
    },
    TooManyBots: {
        defaultMessage: "More than {max} bots may slow the game down.",
        description: "Warning shown when the chosen number of bots is above the recommended maximum",
    },
});

export function difficultyOptions(intl: IntlShape) {
    return [
        { value: "Passive", label: intl.formatMessage(BOT_MESSAGES.Passive) },
        ...DIFFICULTIES.map((d) => ({ value: d, label: intl.formatMessage(BOT_MESSAGES[d]) })),
        { value: "Random", label: intl.formatMessage(BOT_MESSAGES.RandomDifficulty) },
    ];
}

type HostMenuProps = {
    opened: boolean;
    onClose: () => void;
    lobbyName: string;
    onLobbyNameChange: (name: string) => void;
    worldState: WorldState | null;
    onEndRound: () => void;
    gameSettings: GameSettings;
    onChangeGame: (settings: GameSettings) => void;
    hostGuid: string;
    playerData: PlayerProperties[];
    onKickPlayer: (guid: string) => void;
    bots: BotInfo[];
    onAddBots: (count: number, team: Team | null, difficulty: BotDifficultyChoice) => void;
    onRemoveBots: (guids: string[]) => void;
};

export function HostMenu(props: HostMenuProps) {
    const intl = useIntl();

    return (
        <Modal
            opened={props.opened}
            onClose={props.onClose}
            size="lg"
            title={
                <span className={classes.title}>
                    <IconSettings size={22} stroke={2.4} />
                    <FormattedMessage
                        defaultMessage="Host menu"
                        description="Title of the host game management dialog"
                    />
                </span>
            }
        >
            <Tabs defaultValue="game" keepMounted={false}>
                <Tabs.List grow mb="md">
                    <Tabs.Tab value="game" leftSection={<IconSettings size={16} stroke={2.4} />}>
                        {intl.formatMessage({
                            defaultMessage: "Game",
                            description: "Host menu tab with lobby and round settings",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="map" leftSection={<IconMap size={16} stroke={2.4} />}>
                        {intl.formatMessage({
                            defaultMessage: "Map & mode",
                            description: "Host menu tab for changing the level, game mode and round length",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="players" leftSection={<IconUsers size={16} stroke={2.4} />}>
                        {intl.formatMessage({
                            defaultMessage: "Players",
                            description: "Host menu tab listing connected players",
                        })}
                    </Tabs.Tab>
                    <Tabs.Tab value="bots" leftSection={<IconRobot size={16} stroke={2.4} />}>
                        <FormattedMessage
                            defaultMessage="Bots"
                            description="Title of the host panel for managing bots"
                        />
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="game">
                    <GameTab {...props} />
                </Tabs.Panel>
                <Tabs.Panel value="map">
                    <MapTab {...props} />
                </Tabs.Panel>
                <Tabs.Panel value="players">
                    <PlayersTab {...props} />
                </Tabs.Panel>
                <Tabs.Panel value="bots">
                    <BotsTab {...props} />
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}

function GameTab({ lobbyName, onLobbyNameChange, worldState, onEndRound }: HostMenuProps) {
    const intl = useIntl();
    const [draft, setDraft] = useState(lobbyName);

    useEffect(() => setDraft(lobbyName), [lobbyName]);

    function submitName(event: FormEvent) {
        event.preventDefault();
        onLobbyNameChange(draft);
    }

    const playing = worldState === "Playing" || worldState === null;

    return (
        <Stack gap="lg">
            <form onSubmit={submitName}>
                <Group gap="xs" align="flex-end" wrap="nowrap">
                    <TextInput
                        className={classes.grow}
                        label={intl.formatMessage({
                            defaultMessage: "Lobby name",
                            description: "Label for the input used to name the hosted game",
                        })}
                        placeholder={intl.formatMessage({
                            defaultMessage: "Unnamed lobby",
                            description: "Placeholder for the lobby name input when no name is set",
                        })}
                        maxLength={LOBBY_NAME_MAX_LENGTH}
                        value={draft}
                        onChange={(event) => setDraft(event.currentTarget.value)}
                    />
                    <Button
                        type="submit"
                        color="grass"
                        disabled={draft.trim() === lobbyName}
                        rightSection={<IconDeviceFloppy size={18} stroke={2.4} />}
                    >
                        <FormattedMessage
                            defaultMessage="Save"
                            description="Button that saves the lobby name in the host menu"
                        />
                    </Button>
                </Group>
            </form>

            <Stack gap={6}>
                <Button
                    color="copper"
                    fullWidth
                    onClick={onEndRound}
                    rightSection={<IconPlayerSkipForward size={18} stroke={2.4} />}
                >
                    {playing ? (
                        <FormattedMessage
                            defaultMessage="End round"
                            description="Host menu button that ends the current round as a tie"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Start next round"
                            description="Host menu button that skips the round results and intermission"
                        />
                    )}
                </Button>
                <span className={classes.hint}>
                    {playing ? (
                        <FormattedMessage
                            defaultMessage="Ends the round as a tie. Press again to skip straight to the next round."
                            description="Explanation under the host menu end round button"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Skips the results and intermission and starts a new round now."
                            description="Explanation under the host menu start next round button"
                        />
                    )}
                </span>
            </Stack>
        </Stack>
    );
}

function MapTab({ gameSettings, onChangeGame, onClose }: HostMenuProps) {
    const [draft, setDraft] = useState<GameSettings>(gameSettings);
    const [confirming, setConfirming] = useState(false);

    function apply() {
        onChangeGame(draft);
        setConfirming(false);
        onClose();
    }

    return (
        <Stack gap="lg">
            <Group gap="xs" grow align="flex-start">
                <GameSettingsFields
                    value={draft}
                    onChange={(next) => {
                        setDraft(next);
                        setConfirming(false);
                    }}
                />
            </Group>
            <span className={classes.hint}>
                <FormattedMessage
                    defaultMessage="Starts a fresh game on the chosen map for everyone. Players and bots stay, but teams, scores and the replay start over."
                    description="Explanation in the host menu of what changing the map or mode does"
                />
            </span>
            {confirming ? (
                <Group gap="xs" grow>
                    <Button variant="default" onClick={() => setConfirming(false)}>
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Host menu button that cancels restarting the game with new settings"
                        />
                    </Button>
                    <Button color="red" onClick={apply} rightSection={<IconRefresh size={18} stroke={2.4} />}>
                        <FormattedMessage
                            defaultMessage="Restart now"
                            description="Host menu button that confirms restarting the game with new settings"
                        />
                    </Button>
                </Group>
            ) : (
                <Button
                    color="copper"
                    fullWidth
                    onClick={() => setConfirming(true)}
                    rightSection={<IconRefresh size={18} stroke={2.4} />}
                >
                    <FormattedMessage
                        defaultMessage="Restart with these settings"
                        description="Host menu button that starts a new game with the chosen map and mode, keeping players"
                    />
                </Button>
            )}
        </Stack>
    );
}

function TeamFlag({ team }: { team: TeamChoice }) {
    return <img className={classes.flag} src={FLAGS[team]} alt="" />;
}

function PlayersTab({ hostGuid, playerData, onKickPlayer }: HostMenuProps) {
    const intl = useIntl();
    const [confirmKick, setConfirmKick] = useState<string | null>(null);
    const players = playerData.filter((p) => !p.bot && p.guid);

    if (!players.length) {
        return (
            <span className={classes.hint}>
                <FormattedMessage
                    defaultMessage="No players have joined yet."
                    description="Shown in the host menu players tab when nobody is connected"
                />
            </span>
        );
    }

    return (
        <ul className={classes.list}>
            {players.map((player) => {
                const guid = player.guid!;
                const isHost = guid === hostGuid;
                return (
                    <li key={guid} className={classes.row}>
                        <TeamFlag team={player.team ?? "Random"} />
                        <span className={classes.name}>{player.name}</span>
                        {isHost ? (
                            <span className={classes.meta}>
                                <FormattedMessage
                                    defaultMessage="Host"
                                    description="Label next to the host's own name in the host menu players list"
                                />
                            </span>
                        ) : (
                            <span className={classes.meta}>{player.ping ?? 0} ms</span>
                        )}
                        {!isHost &&
                            (confirmKick === guid ? (
                                <Group gap={4} wrap="nowrap">
                                    <Button
                                        size="compact-sm"
                                        color="red"
                                        onClick={() => {
                                            onKickPlayer(guid);
                                            setConfirmKick(null);
                                        }}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Remove"
                                            description="Host menu button that confirms removing a player from the game"
                                        />
                                    </Button>
                                    <ActionIcon
                                        variant="light"
                                        color="gray"
                                        onClick={() => setConfirmKick(null)}
                                        aria-label={intl.formatMessage({
                                            defaultMessage: "Cancel",
                                            description: "Host menu button that cancels removing a player",
                                        })}
                                    >
                                        <IconX size={14} stroke={3} />
                                    </ActionIcon>
                                </Group>
                            ) : (
                                <Tooltip
                                    label={intl.formatMessage({
                                        defaultMessage: "Remove player",
                                        description: "Host menu tooltip for the button that removes a player",
                                    })}
                                >
                                    <ActionIcon
                                        variant="light"
                                        color="copper"
                                        onClick={() => setConfirmKick(guid)}
                                        aria-label={intl.formatMessage({
                                            defaultMessage: "Remove player",
                                            description: "Host menu tooltip for the button that removes a player",
                                        })}
                                    >
                                        <IconUserMinus size={16} stroke={2.4} />
                                    </ActionIcon>
                                </Tooltip>
                            ))}
                    </li>
                );
            })}
        </ul>
    );
}

function BotsTab({ bots, playerData, onAddBots, onRemoveBots }: HostMenuProps) {
    const intl = useIntl();
    const [team, setTeam] = useState<TeamChoice>("Random");
    const [difficulty, setDifficulty] = useState<BotDifficultyChoice>("Medium");
    const [count, setCount] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const selectedBots = bots.filter((b) => selected.has(b.guid));
    const allSelected = bots.length > 0 && selectedBots.length === bots.length;

    useEffect(() => {
        const present = new Set(bots.map((b) => b.guid));
        setSelected((prev) => new Set([...prev].filter((guid) => present.has(guid))));
    }, [bots]);

    function toggle(guid: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(guid)) next.delete(guid);
            else next.add(guid);
            return next;
        });
    }

    const teamOption = (choice: TeamChoice) => ({
        value: choice,
        label: (
            <span className={classes.teamOption}>
                <TeamFlag team={choice} />
                {intl.formatMessage(BOT_MESSAGES[choice])}
            </span>
        ),
    });

    return (
        <Stack gap="md">
            <SegmentedControl
                fullWidth
                size="xs"
                value={team}
                onChange={(value) => setTeam(value as TeamChoice)}
                data={[teamOption("Centrals"), teamOption("Random"), teamOption("Allies")]}
            />
            <Group gap="xs" align="flex-end" wrap="nowrap">
                <NumberInput
                    className={classes.count}
                    label={intl.formatMessage({
                        defaultMessage: "Count",
                        description: "Label for the number of bots to add at once in the host menu",
                    })}
                    min={1}
                    clampBehavior="strict"
                    allowDecimal={false}
                    value={count}
                    onChange={(value) => setCount(typeof value === "number" ? value : 1)}
                />
                <Select
                    className={classes.grow}
                    label={intl.formatMessage({
                        defaultMessage: "Difficulty",
                        description: "Bot panel: label for the bot difficulty dropdown",
                    })}
                    value={difficulty}
                    onChange={(value) => value && setDifficulty(value as BotDifficultyChoice)}
                    data={difficultyOptions(intl)}
                    allowDeselect={false}
                />
                <Button
                    color="copper"
                    onClick={() => onAddBots(count, team === "Random" ? null : team, difficulty)}
                    rightSection={<IconUserPlus size={18} stroke={2.4} />}
                >
                    <FormattedMessage
                        defaultMessage="Add {count, plural, one {Bot} other {# Bots}}"
                        description="Host menu button that adds the chosen number of bots"
                        values={{ count }}
                    />
                </Button>
            </Group>
            {bots.length + count > BOT_WARNING_THRESHOLD && (
                <Text size="sm" c="orange">
                    {intl.formatMessage(BOT_MESSAGES.TooManyBots, { max: BOT_WARNING_THRESHOLD })}
                </Text>
            )}
            {team === "Random" && (
                <span className={classes.hint}>
                    <FormattedMessage
                        defaultMessage="Random bots join whichever team has fewer players, keeping teams balanced."
                        description="Explanation in the host menu of how bots without a chosen team pick a team"
                    />
                </span>
            )}

            {bots.length > 0 && (
                <>
                    <Group justify="space-between" wrap="nowrap">
                        <Checkbox
                            label={intl.formatMessage(
                                {
                                    defaultMessage: "{count, plural, one {# bot} other {# bots}}",
                                    description: "Host menu checkbox that selects all bots, showing the bot count",
                                },
                                { count: bots.length },
                            )}
                            checked={allSelected}
                            indeterminate={selectedBots.length > 0 && !allSelected}
                            onChange={() => setSelected(allSelected ? new Set() : new Set(bots.map((b) => b.guid)))}
                        />
                        <Group gap="xs" wrap="nowrap">
                            <Button
                                size="compact-sm"
                                variant="light"
                                color="copper"
                                disabled={!selectedBots.length}
                                onClick={() => onRemoveBots(selectedBots.map((b) => b.guid))}
                                leftSection={<IconTrash size={14} stroke={2.4} />}
                            >
                                <FormattedMessage
                                    defaultMessage="Remove selected"
                                    description="Host menu button that removes the selected bots"
                                />
                            </Button>
                            <Button
                                size="compact-sm"
                                color="red"
                                onClick={() => onRemoveBots(bots.map((b) => b.guid))}
                                leftSection={<IconTrash size={14} stroke={2.4} />}
                            >
                                <FormattedMessage
                                    defaultMessage="Remove all"
                                    description="Host menu button that removes every bot"
                                />
                            </Button>
                        </Group>
                    </Group>
                    <ul className={classes.list}>
                        {bots.map((bot) => {
                            const player = playerData.find((p) => p.guid === bot.guid);
                            const shownTeam: TeamChoice = player?.team ?? bot.team ?? "Random";
                            return (
                                <li key={bot.guid} className={classes.row}>
                                    <Checkbox
                                        checked={selected.has(bot.guid)}
                                        onChange={() => toggle(bot.guid)}
                                        aria-label={bot.name}
                                    />
                                    <TeamFlag team={shownTeam} />
                                    <span className={classes.name}>{bot.name}</span>
                                    <span className={classes.meta}>
                                        {intl.formatMessage(BOT_MESSAGES[bot.difficulty])}
                                    </span>
                                    <Tooltip
                                        label={intl.formatMessage({
                                            defaultMessage: "Remove bot",
                                            description: "Bot panel: tooltip for the button that removes a bot",
                                        })}
                                    >
                                        <ActionIcon
                                            variant="light"
                                            color="copper"
                                            onClick={() => onRemoveBots([bot.guid])}
                                            aria-label={intl.formatMessage({
                                                defaultMessage: "Remove bot",
                                                description: "Bot panel: tooltip for the button that removes a bot",
                                            })}
                                        >
                                            <IconX size={14} stroke={3} />
                                        </ActionIcon>
                                    </Tooltip>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </Stack>
    );
}
