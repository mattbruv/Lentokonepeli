import { useState } from "react";
import "./App.css";
import { DogfightWeb } from "dogfight-web";
import { sayGoodbye } from "dogfight-renderer";
import { EntityChange } from "dogfight-renderer/dist/bindings/EntityChange";

function App() {
  const [count, setCount] = useState(0);

  let web = DogfightWeb.new();
  //console.log(web);
  //let state = web.get_changed_state();
  let x = web.get_changed_state();
  console.log(x);
  let state = JSON.parse(x) as EntityChange[];
  let foo = sayGoodbye(state);
  console.log(foo);
  //console.log(state);
  console.log(x);

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more ok
      </p>
    </>
  );
}

export default App;
