import { defineMessage, MessageDescriptor } from "react-intl";
import { GameAction } from "../hooks/keybinds/models";

export const KEYBIND_INTL: Record<GameAction, MessageDescriptor> = {
    left: defineMessage({
        defaultMessage: "Move Left",
        description: "Title for the 'Move Left' action shown on the keybind settings section",
    }),
    right: defineMessage({
        defaultMessage: "Move Right",
        description: "Title for the 'Move Right' action shown on the keybind settings section",
    }),
    down: defineMessage({
        defaultMessage: "Toggle Motor",
        description: "Title for the 'Toggle Motor' action shown on the keybind settings section",
    }),
    up: defineMessage({
        defaultMessage: "Flip Plane",
        description: "Title for the 'Flip Plane' action shown on the keybind settings section",
    }),
    shift: defineMessage({
        defaultMessage: "Bomb",
        description: "Title for the 'Bomb' action shown on the keybind settings section",
    }),
    space: defineMessage({
        defaultMessage: "Eject, Open Parachute",
        description: "Title for the 'Eject, Open Parachute' action shown on the keybind settings section",
    }),
    enter: defineMessage({
        defaultMessage: "Enter",
        description: "Title for the 'Enter' action shown on the keybind settings section",
    }),
    ctrl: defineMessage({
        defaultMessage: "Shoot",
        description: "Title for the 'Shoot' action shown on the keybind settings section",
    }),
    chatAll: defineMessage({
        defaultMessage: "Chat All",
        description: "Title for the 'Chat All' action shown on the keybind settings section",
    }),
    chatTeam: defineMessage({
        defaultMessage: "Chat Team",
        description: "Title for the 'Chat Team' action shown on the keybind settings section",
    }),
    viewScoreboard: defineMessage({
        defaultMessage: "View Scoreboard",
        description: "Title for the 'View Scoreboard' action shown on the keybind settings section",
    }),
};

export const GAME_INTL = {
    plane_name_Albatros: defineMessage({
        defaultMessage: "Albatros D.II",
        description: "Name of the Albatros D.II aircraft",
    }),
    plane_description_Albatros: defineMessage({
        defaultMessage:
            "Basic aircraft equipped with a machine gun, without particularly good or bad qualities. A good choice for a beginner.",
        description: "Description of the Albatros D.II aircraft",
    }),
    plane_name_Fokker: defineMessage({
        defaultMessage: "Fokker DR.I",
        description: "Name of the Fokker DR.I aircraft",
    }),
    plane_description_Fokker: defineMessage({
        defaultMessage: "A legendary triplane. Extremely agile and also excellent at maximum flight altitude.",
        description: "Description of the Fokker DR.I aircraft",
    }),
    plane_name_Junkers: defineMessage({
        defaultMessage: "Junkers J.1",
        description: "Name of the Junkers J.1 aircraft",
    }),
    plane_description_Junkers: defineMessage({
        defaultMessage: "Equipped with bombs in addition to a machine gun, extremely durable, but a clumsy aircraft.",
        description: "Description of the Junkers J.1 aircraft",
    }),
    plane_name_Bristol: defineMessage({
        defaultMessage: "Bristol F.2b",
        description: "Name of the Bristol F.2b aircraft",
    }),
    plane_description_Bristol: defineMessage({
        defaultMessage:
            "An aircraft equipped with a fairly powerful machine gun. A good choice, especially for beginner pilots.",
        description: "Description of the Bristol F.2b aircraft",
    }),
    plane_name_Sopwith: defineMessage({
        defaultMessage: "Sopwith Camel",
        description: "Name of the Sopwith Camel aircraft",
    }),
    plane_description_Sopwith: defineMessage({
        defaultMessage: "Extremely agile. Not recommended for beginner pilots.",
        description: "Description of the Sopwith Camel aircraft",
    }),
    plane_name_Salmson: defineMessage({
        defaultMessage: "Salmson 2",
        description: "Name of the Salmson 2 aircraft",
    }),
    plane_description_Salmson: defineMessage({
        defaultMessage:
            "Versatile mid-tier aircraft. Equipped with bombs in addition to a machine gun. Fast and powerful engine, though not agile.",
        description: "Description of the Salmson 2 aircraft",
    }),
} as const satisfies Record<string, MessageDescriptor>;
