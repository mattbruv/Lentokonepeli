import { defineMessage } from "react-intl";

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
} as const;
