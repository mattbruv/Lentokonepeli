type LanguageEntry = {
    tag: string,
    name: string
};

export const Languages: LanguageEntry[] = [
    {
        tag: "en",
        name: "English"
    },
    {
        tag: "es",
        name: "Español"
    },
    {
        tag: "fi",
        name: "suomi"
    },/*
    {
        tag: "de",
        name: "Deutsch"
    }*/
]

Languages.sort((a, b) => {
    if (b.tag === "en") {
        return 1;
    }
    return a.tag.localeCompare(b.tag);
});