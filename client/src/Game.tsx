import { Ref, useEffect, useRef, useState } from "react";
import { useDogfight } from "./hooks/useDogfight";
import { Alert, Button, Flex, InputLabel, Modal, NumberInput, Select, TextInput, TypographyStylesProviderFactory } from "@mantine/core";
import Levels from "./assets/levels.json"
import { useDisclosure, useSet } from "@mantine/hooks";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useDogfight()
  const [gameMap, setGameMap] = dogfight.gameMap
  const { hostLobby, joinGame, initClient, roomCode, peer } = dogfight

  const [joinId, setJoinId] = useState("")

  // const [tickRate, setTickRate] = useState(100)

  const [opened, { open, close }] = useDisclosure()

  function host() {
    if (!gameContainer.current) return;
    hostLobby(() => {
      initClient(gameContainer.current!)
    })
  }

  async function join(roomId: string) {
    if (!gameContainer.current) return;

    await initClient(gameContainer.current)
    joinGame(roomId, () => {
      close()
    })
  }

  return (
    <div>
      <Flex direction={"row"}>
        <div ref={gameContainer}></div>
        <Flex direction={"column"}>
          <h2>Lentokonepeli Demo</h2>
          {roomCode ? <div>
            Game Code:
            <h1>{roomCode}</h1>
          </div> : null}
          {/*
          {tickRate != 100 ? (
            <Alert style={{ maxWidth: 300 }} variant="light" color="red" title="Bullet Rendering Issue">
              Bullet update speed on the client will be broken temporarily when playing at a custom tick rate. Please ignore this visual error for now.
            </Alert>
          ) : null}
          */}
          {!peer.current ?
            <div>
              {/*
              <div>
                <InputLabel >Ticks Per Second:</InputLabel>
                <NumberInput allowDecimal={false} min={1} max={500} value={tickRate} onChange={(e) => setTickRate(typeof e == "string" ? parseInt(e) : e)} placeholder="Enter tick rate (ms)" />
                <div>
                  Tick rate (ms): {(1000 / tickRate).toPrecision(4)}
                </div>
              </div>
              */}
              <div>
                <h3>Host a Game (WebRTC)</h3>
                <InputLabel >Level:</InputLabel>
                <Select data={Object.keys(Levels)} value={gameMap} onChange={(v) => { if (v) { setGameMap(v as keyof typeof Levels) } }} placeholder="Select a game map..." />
                <Button color={"cyan"} disabled={false} onClick={host}>Host Game</Button>
              </div>
              <div>
                <h3>Join a Game (WebRTC)</h3>
                <Button onClick={open}>Join a Game</Button>
                <Modal opened={opened} onClose={close} color={"green"} title="Join Room">
                  <TextInput value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Enter 4 digit room id..." />
                  <Button disabled={joinId.length != 4} color={"green"} onClick={() => join(joinId)}>Join Host!</Button>
                </Modal>
              </div>
            </div>
            : null}
        </Flex>
      </Flex>

    </div>
  );
}
