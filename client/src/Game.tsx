import { useEffect, useRef, useState } from "react";
import { ConnectionType, useDogfight } from "./hooks/useDogfight";
import { Button, Flex, InputLabel, Select, TextInput, TypographyStylesProviderFactory } from "@mantine/core";
import Levels from "./assets/levels.json"

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const [offerValue, setOfferValue] = useState<string>("")

  const dogfight = useDogfight()
  const [gameMap, setGameMap] = dogfight.gameMap

  async function createOffer() {
    if (gameContainer.current) {
      dogfight.initWebRTC(ConnectionType.Host)
      await dogfight.initClient(gameContainer.current)
    }

    await dogfight.createOffer((offer) => {
      const msg = btoa(offer)
      setOfferValue(msg)
      navigator.clipboard.writeText(msg)
      console.log("offer copied to clipboard")
    })
  }

  async function createAnswer() {
    if (gameContainer.current) {
      dogfight.initWebRTC(ConnectionType.Guest)
      await dogfight.initClient(gameContainer.current)
    }
    const offer = atob(await navigator.clipboard.readText())
    await dogfight.createAnswer(offer, (answer) => {
      const ans = btoa(answer)
      navigator.clipboard.writeText(ans)
      console.log("answer copied to clipboard")
    })
  }

  async function acceptAnswer() {
    const answer = atob(await navigator.clipboard.readText())
    await dogfight.acceptAnswer(answer)
    console.log("ACCEPTED ANSWER!")
  }


  useEffect(() => {
  }, []);

  return (
    <div>
      <Flex direction={"row"}>
        <div ref={gameContainer}></div>
        <Flex direction={"column"}>
          <h2>Lentokonepeli Demo</h2>
          <div>
            <h3>Host a Game (WebRTC)</h3>
            <InputLabel >Level:</InputLabel>
            <Select data={Object.keys(Levels)} value={gameMap} onChange={(v) => { if (v) { setGameMap(v as keyof typeof Levels) } }} placeholder="Select a game map..." />
            <Button color={"cyan"} disabled={offerValue != ""} onClick={createOffer}>Create Offer</Button>
            <Button disabled={offerValue == ""} color={"cyan"} onClick={acceptAnswer}>Accept Player Answer</Button>
          </div>
          <div>
            <h3>Join a Game (WebRTC)</h3>
            <Button onClick={createAnswer}>Create Answer</Button>
          </div>
        </Flex>
      </Flex>

    </div>
  );
}
