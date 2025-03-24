import { AppShell, Burger, Button, Group, Text, Tooltip, UnstyledButton, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandDiscord, IconBrandGithub, IconMoon, IconSun } from "@tabler/icons-react";
import { FormattedMessage, useIntl } from "react-intl";
import { NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import classes from "./App.module.css";
import { Lobby } from "./Lobby";
import { Replay } from "./Replay";
import { Settings } from "./Settings";

function App() {
    const intl = useIntl();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

    const { toggleColorScheme, colorScheme } = useMantineColorScheme();

    const toggleLight = intl.formatMessage({
        defaultMessage: "Toggle Light Mode",
        description: "Toggle light mode button text",
    });
    const toggleDark = intl.formatMessage({
        defaultMessage: "Toggle Dark Mode",
        description: "Toggle dark mode button text",
    });
    const toggleText = colorScheme === "dark" ? toggleLight : toggleDark;

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { desktop: !desktopOpened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
                    <Group justify="space-between" style={{ flex: 1 }}>
                        <Text size={"lg"}>
                            <FormattedMessage
                                defaultMessage={"Lentokonepeli (In Development)"}
                                description={"Main title of site shown on nav"}
                            />
                        </Text>
                        <Group ml="xl" gap={0} visibleFrom="sm">
                            <Button.Group>
                                <Tooltip
                                    label={intl.formatMessage({
                                        defaultMessage: "Join us on Discord!",
                                        description: "Navbar hover for discord button",
                                    })}
                                >
                                    <Button
                                        component="a"
                                        target={"_blank"}
                                        href="https://discord.gg/QjtXPmx"
                                        variant={"subtle"}
                                    >
                                        <IconBrandDiscord />
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    label={intl.formatMessage({
                                        defaultMessage: "View the Source Code on GitHub",
                                        description: "Navbar hover for viewing the source code",
                                    })}
                                >
                                    <Button
                                        component="a"
                                        target={"_blank"}
                                        href="https://github.com/mattbruv/Lentokonepeli"
                                        variant={"subtle"}
                                    >
                                        <IconBrandGithub />
                                    </Button>
                                </Tooltip>
                                <Tooltip label={toggleText}>
                                    <Button onClick={toggleColorScheme} variant={"subtle"}>
                                        {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
                                    </Button>
                                </Tooltip>
                            </Button.Group>
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Navbar py="md" px={4}>
                <NavLink to={"/"}>
                    <UnstyledButton className={classes.control}>
                        <FormattedMessage
                            defaultMessage={"Play"}
                            description={"Sidebar link description for the main game page used to play the game"}
                        />
                    </UnstyledButton>
                </NavLink>
                <NavLink to={"/replay"}>
                    <UnstyledButton className={classes.control}>
                        {" "}
                        <FormattedMessage
                            defaultMessage={"Watch Replay"}
                            description={"Sidebar link description for the Replay System page"}
                        />
                    </UnstyledButton>
                </NavLink>
                <UnstyledButton className={classes.control}>
                    {" "}
                    <FormattedMessage
                        defaultMessage={"Level Editor"}
                        description={"Sidebar link description for the Level Editor"}
                    />
                </UnstyledButton>
                <NavLink to={"/settings"}>
                    <UnstyledButton className={classes.control}>
                        {" "}
                        <FormattedMessage
                            defaultMessage={"Settings"}
                            description={"Sidebar link description for the Settings page"}
                        />
                    </UnstyledButton>
                </NavLink>
            </AppShell.Navbar>
            <AppShell.Main>
                <Routes>
                    <Route path="/" element={<Lobby />} />
                    <Route path="/replay" element={<Replay />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}

export default App;
