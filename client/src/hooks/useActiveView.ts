import { useEffect } from "react";
import { ActiveView, useSettingsContext } from "../contexts/settingsContext";

let leaving = false;

export function leaveActiveGame() {
    leaving = true;
}

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (leaving) return;
    event.preventDefault();
    event.returnValue = "";
}

export function useActiveView(view: Exclude<ActiveView, null>, active = true) {
    const { setGlobalState } = useSettingsContext();

    useEffect(() => {
        if (!active) return;
        setGlobalState((prev) => ({ ...prev, activeView: view }));

        if (view === "game") {
            leaving = false;
            window.addEventListener("beforeunload", onBeforeUnload);
        }

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            setGlobalState((prev) => ({ ...prev, activeView: prev.activeView === view ? null : prev.activeView }));
        };
    }, [view, active]);
}
