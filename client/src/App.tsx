import { Box } from "@mantine/core";
import "./App.css";
import { Game } from "./Game";

function App() {
  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Game />
    </Box>
  );
}

export default App;
