import { Button, Modal, NumberInput, PinInput, Select, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEye, IconPlaneDeparture, IconUsers } from "@tabler/icons-react";
import { FormEvent, useState } from "react";

import { FormattedMessage, useIntl } from "react-intl";
import hostArt from "../assets/ui/pic_plane6.gif";
import joinArt from "../assets/ui/pic_plane9.gif";
import { GameSettings, GameSettingsFields } from "../components/GameSettingsFields";
import { Guest } from "../components/Guest";
import { Host } from "../components/Host";
import { BOT_MESSAGES, difficultyOptions } from "../components/HostMenu";
import { NameEditor } from "../components/NameEditor";
import { RulesField } from "../components/RulesEditor";
import { Panel } from "../components/ui/Panel";
import { useSettingsContext } from "../contexts/settingsContext";
import { defaultRules } from "../rules";
import { BOT_WARNING_THRESHOLD, BotDifficultyChoice, LOBBY_NAME_MAX_LENGTH, MAX_BOTS } from "../hooks/useLocalHost";
import classes from "./Lobby.module.css";

enum LobbyState {
    Choosing,
    Hosting,
    Joining,
    Watching,
}

export function Lobby() {
    const intl = useIntl();
    const [lobbyState, setLobbyState] = useState<LobbyState>(LobbyState.Choosing);

    const [gameSettings, setGameSettings] = useState<GameSettings>({
        levelKey: "classic",
        gameTime: 0,
        gameMode: "Normal",
        rules: defaultRules(),
    });
    const [lobbyName, setLobbyName] = useState("");
    const [botCount, setBotCount] = useState(0);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficultyChoice>("Medium");

    const [joinId, setJoinId] = useState<string>("");

    const [opened, { open, close }] = useDisclosure();
    const { settings } = useSettingsContext();

    function promptUsername() {
        if (!settings.username) {
            open();
        }
    }

    function submitJoin(event: FormEvent) {
        event.preventDefault();
        if (joinId.length === 4) setLobbyState(LobbyState.Joining);
    }

    if (lobbyState === LobbyState.Hosting) {
        return (
            <Host
                settings={gameSettings}
                recordGame={false}
                lobbyName={lobbyName}
                initialBots={{ count: botCount, difficulty: botDifficulty }}
            />
        );
    }
    if (lobbyState === LobbyState.Joining) return <Guest gameCode={joinId} />;
    if (lobbyState === LobbyState.Watching) return <Guest gameCode={joinId} spectator />;

    return (
        <div>
            <Modal
                opened={opened}
                closeOnClickOutside={false}
                onClose={close}
                title={intl.formatMessage({
                    defaultMessage: "Choose Username",
                    description: "Title for modal used to choose username",
                })}
            >
                <NameEditor showTip onSuccess={close} />
            </Modal>
            <div className={classes.grid}>
                <Panel
                    pop
                    icon={<IconUsers size={26} stroke={2.4} />}
                    title={
                        <FormattedMessage
                            defaultMessage={"Join a Game"}
                            description={"Title for part for joining the game"}
                        />
                    }
                >
                    <form className={classes.card} onSubmit={submitJoin}>
                        <div className={classes.art}>
                            <img src={joinArt} alt="" />
                        </div>
                        <div className={classes.field}>
                            <label className={classes.fieldLabel} htmlFor="lk-join-code">
                                <FormattedMessage
                                    defaultMessage={"Code"}
                                    description={"Title for selection used to insert the game code"}
                                />
                            </label>
                            <PinInput
                                id="lk-join-code"
                                className={classes.pin}
                                length={4}
                                size="xl"
                                placeholder=""
                                type={/^[0-9a-fA-F]+$/}
                                value={joinId}
                                onChange={(value) => setJoinId(value.toLowerCase())}
                                aria-label={intl.formatMessage({
                                    defaultMessage: "Enter the 4 digit game code...",
                                    description:
                                        "Infotext for input which is used to insert 4 digit game code to join games",
                                })}
                            />
                        </div>
                        <Button
                            type="submit"
                            className={classes.cta}
                            onMouseOver={promptUsername}
                            onFocus={promptUsername}
                            color={"grass"}
                            disabled={joinId.length != 4}
                            size={"lg"}
                            fullWidth
                        >
                            <FormattedMessage
                                defaultMessage={"Join Game"}
                                description={"Call to action button text for button which joins a an existing game"}
                            />
                        </Button>
                        <Button
                            onMouseOver={promptUsername}
                            onFocus={promptUsername}
                            onClick={() => joinId.length === 4 && setLobbyState(LobbyState.Watching)}
                            variant="default"
                            disabled={joinId.length != 4}
                            fullWidth
                            leftSection={<IconEye size={18} stroke={2.2} />}
                        >
                            <FormattedMessage
                                defaultMessage={"Spectate Game"}
                                description={"Button that joins an existing game as a spectator without playing"}
                            />
                        </Button>
                    </form>
                </Panel>

                <Panel
                    pop
                    className={classes.second}
                    icon={<IconPlaneDeparture size={26} stroke={2.4} />}
                    title={
                        <FormattedMessage
                            defaultMessage={"Host a Game"}
                            description={"Title for section used for hosting a game"}
                        />
                    }
                >
                    <div className={classes.card}>
                        <div className={classes.art}>
                            <img src={hostArt} alt="" />
                        </div>
                        <TextInput
                            label={intl.formatMessage({
                                defaultMessage: "Lobby name",
                                description: "Label for the input used to name the hosted game",
                            })}
                            placeholder={intl.formatMessage({
                                defaultMessage: "Unnamed lobby",
                                description: "Placeholder for the lobby name input when no name is set",
                            })}
                            maxLength={LOBBY_NAME_MAX_LENGTH}
                            value={lobbyName}
                            onChange={(event) => setLobbyName(event.currentTarget.value)}
                        />
                        <div className={classes.row}>
                            <GameSettingsFields
                                value={gameSettings}
                                onChange={setGameSettings}
                                className={classes.grow}
                                levelClassNames={{ input: classes.levelInput, option: classes.levelOption }}
                            />
                        </div>
                        <RulesField
                            value={gameSettings.rules}
                            onChange={(rules) => setGameSettings({ ...gameSettings, rules })}
                        />
                        <div className={classes.row}>
                            <NumberInput
                                className={classes.grow}
                                label={intl.formatMessage({
                                    defaultMessage: "Bots",
                                    description: "Label for the number of bots the hosted game starts with",
                                })}
                                min={0}
                                max={MAX_BOTS}
                                clampBehavior="strict"
                                allowDecimal={false}
                                value={botCount}
                                onChange={(value) => setBotCount(typeof value === "number" ? value : 0)}
                            />
                            <Select
                                className={classes.grow}
                                label={intl.formatMessage({
                                    defaultMessage: "Difficulty",
                                    description: "Bot panel: label for the bot difficulty dropdown",
                                })}
                                disabled={botCount === 0}
                                value={botDifficulty}
                                allowDeselect={false}
                                data={difficultyOptions(intl)}
                                onChange={(v) => v && setBotDifficulty(v as BotDifficultyChoice)}
                            />
                        </div>
                        {botCount > BOT_WARNING_THRESHOLD && (
                            <Text size="sm" c="orange">
                                {intl.formatMessage(BOT_MESSAGES.TooManyBots, { max: BOT_WARNING_THRESHOLD })}
                            </Text>
                        )}
                        <Button
                            className={classes.cta}
                            onMouseOver={promptUsername}
                            onFocus={promptUsername}
                            size={"lg"}
                            color={"sky"}
                            fullWidth
                            onClick={() => setLobbyState(LobbyState.Hosting)}
                        >
                            <FormattedMessage
                                defaultMessage={"Host Game"}
                                description={"Call to action button text for button which starts a new game as a Host"}
                            />
                        </Button>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
