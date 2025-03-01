import "./App.css";
import { AppShell, Group, Text, Burger, UnstyledButton, Button, Tooltip, useMantineColorScheme, colorsTuple } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./App.module.css"
import { IconBrandDiscord, IconBrandGithub, IconColorPicker, IconMoon, IconSun } from "@tabler/icons-react";
import { Lobby } from "./Lobby";
import { NavLink, Route, Routes } from "react-router-dom";
import { Replay } from "./Replay";

function App() {
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const { toggleColorScheme, colorScheme } = useMantineColorScheme()

  const toggleText = "Toggle " + (colorScheme === "dark" ? "Light" : "Dark") + " Mode"

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Text size={"lg"}>Lentokonepeli (In Development)</Text>
            <Group ml="xl" gap={0} visibleFrom="sm">
              <Button.Group>
                <Tooltip label="Join us on Discord!">
                  <Button component="a" target={"_blank"} href="https://discord.gg/QjtXPmx" variant={"subtle"}><IconBrandDiscord /></Button>
                </Tooltip>
                <Tooltip label="Github">
                  <Button component="a" target={"_blank"} href="https://github.com/mattbruv/Lentokonepeli" variant={"subtle"}><IconBrandGithub /></Button>
                </Tooltip>
                <Tooltip label={toggleText}>
                  <Button onClick={toggleColorScheme} variant={"subtle"}>
                    {colorScheme === "dark" ? (
                      <IconSun />
                    ) : (
                      <IconMoon />
                    )}
                  </Button>
                </Tooltip>
              </Button.Group>
            </Group>
          </Group>

        </Group>
      </AppShell.Header>
      <AppShell.Navbar py="md" px={4}>
        <NavLink to={"/"}>
          <UnstyledButton className={classes.control}>Play</UnstyledButton>
        </NavLink>
        <NavLink to={"/replay"}>
          <UnstyledButton className={classes.control}>Watch Replay</UnstyledButton>
        </NavLink>
        <UnstyledButton className={classes.control}>Level Editor</UnstyledButton>
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/replay" element={<Replay />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
