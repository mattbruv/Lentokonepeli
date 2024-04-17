import { useContext, useState } from "react";
import "./App.css";
import { DogfightContext } from "./DogfightContext";

function App() {
  const dogfight = useContext(DogfightContext);

  // TODO: read string from client and interpret it as a level,
  // render internal state to screen

  return (
    <>
      <h1>Lento</h1>
      <div>
        <p>{dogfight}</p>
      </div>
    </>
  );
}

export default App;
