import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@mantine/core/styles.css";
import "./index.css";

import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/settingsContext.tsx";
import { TextureProvider } from "./contexts/textureContext.tsx";
import { IntlProvider } from "./intl/IntlProvider.tsx";
import { cssVariablesResolver, theme } from "./theme.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <SettingsProvider>
        <IntlProvider>
            <TextureProvider>
                <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
                    <HashRouter>
                        <App />
                    </HashRouter>
                </MantineProvider>
            </TextureProvider>
        </IntlProvider>
    </SettingsProvider>,
);
