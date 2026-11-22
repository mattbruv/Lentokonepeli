import { Button, Modal, PinInput, Select } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlaneDeparture, IconUsers } from "@tabler/icons-react";
import { FormEvent, useState } from "react";
import Levels from "../assets/levels.json";

import { FormattedMessage, useIntl } from "react-intl";
import hostArt from "../assets/ui/pic_plane6.gif";
import joinArt from "../assets/ui/pic_plane9.gif";
import { Guest } from "../components/Guest";
import { Host } from "../components/Host";
import { NameEditor } from "../components/NameEditor";
import { Panel } from "../components/ui/Panel";
import { useSettingsContext } from "../contexts/settingsContext";
import classes from "./Lobby.module.css";

export type LevelName = keyof typeof Levels;

enum LobbyState {
    Choosing,
    Hosting,
    Joining,
}

const GAME_TIME_OPTIONS = [0, 5, 10, 15, 20, 30, 60];

export function Lobby() {
    const intl = useIntl();
    const [lobbyState, setLobbyState] = useState<LobbyState>(LobbyState.Choosing);

    const [gameMap, setGameMap] = useState<LevelName>("classic");
    const [gameTime, setGameTime] = useState<number>(0);

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

    if (lobbyState === LobbyState.Hosting) return <Host level={gameMap} recordGame={false} gameTime={gameTime} />;
    if (lobbyState === LobbyState.Joining) return <Guest gameCode={joinId} />;

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
                                type={/^[0-9a-fA-F]$/}
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
                        <div className={classes.row}>
                            <Select
                                className={classes.grow}
                                label={intl.formatMessage({
                                    defaultMessage: "Level",
                                    description: "Title for selection used to choose the game level",
                                })}
                                classNames={{ input: classes.levelInput, option: classes.levelOption }}
                                data={Object.keys(Levels)}
                                value={gameMap}
                                allowDeselect={false}
                                searchable
                                maxDropdownHeight={260}
                                onChange={(v) => {
                                    if (v) {
                                        setGameMap(v as keyof typeof Levels);
                                    }
                                }}
                                placeholder={intl.formatMessage({
                                    defaultMessage: "Select a game map...",
                                    description:
                                        "Infotext for input used to select which map will be used for the hosted game",
                                })}
                            />
                            <Select
                                className={classes.grow}
                                label={intl.formatMessage({
                                    defaultMessage: "Game time",
                                    description: "Title for selection used to choose the length of each round",
                                })}
                                data={GAME_TIME_OPTIONS.map((minutes) => ({
                                    value: `${minutes}`,
                                    label:
                                        minutes === 0
                                            ? intl.formatMessage({
                                                  defaultMessage: "Unlimited",
                                                  description:
                                                      "Game time option for rounds that only end when a team's base is destroyed",
                                              })
                                            : intl.formatMessage(
                                                  {
                                                      defaultMessage: "{minutes} minutes",
                                                      description: "Game time option showing round length",
                                                  },
                                                  { minutes },
                                              ),
                                }))}
                                value={`${gameTime}`}
                                allowDeselect={false}
                                onChange={(v) => {
                                    if (v) {
                                        setGameTime(Number(v));
                                    }
                                }}
                            />
                        </div>
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
