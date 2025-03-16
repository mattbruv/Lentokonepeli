import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { HashRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/settingsContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <SettingsProvider>
        <MantineProvider>
            <HashRouter>
                <App />
            </HashRouter>
        </MantineProvider>
    </SettingsProvider>,
);
