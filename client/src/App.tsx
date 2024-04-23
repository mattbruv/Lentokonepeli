import { useContext, useState } from "react";
import "./App.css";
import { DogfightContext } from "./DogfightContext";
import { Game } from "./Game";
import levels from "./assets/levels.json";

function App() {
  return (
    <>
      <h1>Lento</h1>
      <Game />
      {/*
      {Object.entries(levels).map((x) => {
        return (
          <>
            <p key={x[0]}>
              <code style={{ whiteSpace: "pre-wrap" }}>{x[1]}</code>
            </p>
          </>
        );
      })}
      */}
    </>
  );
}

export default App;
