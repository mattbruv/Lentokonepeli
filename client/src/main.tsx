import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { HashRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/settingsContext.tsx";
import { TextureProvider } from "./contexts/textureContext.tsx";
import { IntlProvider } from "./intl/IntlProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <SettingsProvider>
        <IntlProvider>
            <TextureProvider>
                <MantineProvider>
                    <HashRouter>
                        <App />
                    </HashRouter>
                </MantineProvider>
            </TextureProvider>
        </IntlProvider>
    </SettingsProvider>,
);
