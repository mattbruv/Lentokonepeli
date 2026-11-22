import { ActionIcon, Button, Modal, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconBrandDiscord, IconBrandGithub, IconDoorExit, IconMoon, IconSun } from "@tabler/icons-react";
import { FormattedMessage, useIntl } from "react-intl";
import { NavLink, Route, Routes, useBlocker } from "react-router-dom";
import classes from "./App.module.css";
import brandPlane from "./assets/ui/plane6.gif";
import parachuter from "./assets/ui/parachuter1.gif";
import { SkyBackdrop } from "./components/ui/SkyBackdrop";
import { useSettingsContext } from "./contexts/settingsContext";
import { GAME_INTL } from "./intl/messages";
import { Editor } from "./views/Editor";
import { Lobby } from "./views/Lobby";
import { Replay } from "./views/Replay";
import { Settings } from "./views/Settings";

function App() {
    const intl = useIntl();
    const { setColorScheme } = useMantineColorScheme();
    const colorScheme = useComputedColorScheme("light");
    const { globalState } = useSettingsContext();
    const inGame = globalState.activeView === "game";

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => inGame && currentLocation.pathname !== nextLocation.pathname,
    );

    const toggleLight = intl.formatMessage({
        defaultMessage: "Toggle Light Mode",
        description: "Toggle light mode button text",
    });
    const toggleDark = intl.formatMessage({
        defaultMessage: "Toggle Dark Mode",
        description: "Toggle dark mode button text",
    });
    const toggleText = colorScheme === "dark" ? toggleLight : toggleDark;

    const navClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${classes.navLink} ${classes.active}` : classes.navLink;

    return (
        <div className={classes.app}>
            <SkyBackdrop calm={globalState.activeView !== null} />
            <Modal
                opened={blocker.state === "blocked"}
                onClose={() => blocker.reset?.()}
                title={intl.formatMessage(GAME_INTL.hud_exit)}
                size="xs"
            >
                <div className={classes.leave}>
                    <img src={parachuter} className={classes.leaveArt} alt="" />
                    <Button
                        color="cherry"
                        fullWidth
                        rightSection={<IconDoorExit size={18} stroke={2.4} />}
                        onClick={() => blocker.proceed?.()}
                    >
                        {intl.formatMessage(GAME_INTL.hud_exit)}
                    </Button>
                </div>
            </Modal>
            <header className={classes.header}>
                <div className={classes.headerInner}>
                    <NavLink to={"/"} className={classes.brand}>
                        <img src={brandPlane} className={classes.brandPlane} alt="" />
                        <span className={classes.brandText}>
                            <FormattedMessage
                                defaultMessage={"Lentokonepeli (In Development)"}
                                description={"Main title of site shown on nav"}
                            />
                        </span>
                    </NavLink>
                    <nav className={classes.nav}>
                        <NavLink to={"/"} end className={navClass}>
                            <FormattedMessage
                                defaultMessage={"Play"}
                                description={"Sidebar link description for the main game page used to play the game"}
                            />
                        </NavLink>
                        <NavLink to={"/replay"} className={navClass}>
                            <FormattedMessage
                                defaultMessage={"Watch Replay"}
                                description={"Sidebar link description for the Replay System page"}
                            />
                        </NavLink>
                        <NavLink to={"/editor"} className={navClass}>
                            <FormattedMessage
                                defaultMessage={"Level Editor"}
                                description={"Sidebar link description for the Level Editor"}
                            />
                        </NavLink>
                        <NavLink to={"/settings"} className={navClass}>
                            <FormattedMessage
                                defaultMessage={"Settings"}
                                description={"Sidebar link description for the Settings page"}
                            />
                        </NavLink>
                    </nav>
                    <div className={classes.actions}>
                        <Tooltip
                            label={intl.formatMessage({
                                defaultMessage: "Join us on Discord!",
                                description: "Navbar hover for discord button",
                            })}
                        >
                            <ActionIcon
                                component="a"
                                target={"_blank"}
                                href="https://discord.gg/QjtXPmx"
                                variant={"subtle"}
                                className={classes.headerIcon}
                                aria-label="Discord"
                            >
                                <IconBrandDiscord />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip
                            label={intl.formatMessage({
                                defaultMessage: "View the Source Code on GitHub",
                                description: "Navbar hover for viewing the source code",
                            })}
                        >
                            <ActionIcon
                                component="a"
                                target={"_blank"}
                                href="https://github.com/mattbruv/Lentokonepeli"
                                variant={"subtle"}
                                className={classes.headerIcon}
                                aria-label="GitHub"
                            >
                                <IconBrandGithub />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={toggleText}>
                            <ActionIcon
                                onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
                                variant={"subtle"}
                                className={classes.headerIcon}
                                aria-label={toggleText}
                            >
                                {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
                            </ActionIcon>
                        </Tooltip>
                    </div>
                </div>
            </header>
            <main className={classes.main}>
                <Routes>
                    <Route path="/" element={<Lobby />} />
                    <Route path="/replay" element={<Replay />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/editor" element={<Editor />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
