export const VOICES = {
    me: { label: "me", description: "the gardener" },
    app: { label: "garden", description: "this place" },
    user: { label: "you", description: "visitor" },
};

export const MANIFESTO_OPENING = [
    {
        voice: "app",
        text: "You found an unmarked path. Good. Maps are for finished places.",
    },
    {
        voice: "me",
        text: "I planted this garden so thoughts could root without asking permission to grow.",
    },
    {
        voice: "app",
        text: "Nothing here is sealed. Tabs are plots: Toolkit, Projects, Connection, Experience, Interests.",
    },
    {
        voice: "me",
        text: "Wander first. Read second. The manifesto is not a lecture · it is a conversation on one page.",
    },
    {
        voice: "app",
        text: "Hold still over the text when you need quiet. It breathes with you if you let it.",
    },
    {
        voice: "me",
        text: "When you speak below, your words get planted here too. The garden keeps what visitors leave behind.",
    },
    {
        voice: "app",
        text: "So: where do you want to walk next?",
    },
];

export const APP_ACKNOWLEDGMENTS = [
    "Planted. Your line roots here now.",
    "Noted. The soil remembers visitors.",
    "Added. Watch it change shape over time.",
    "Kept. This garden grows sideways too.",
];

export const buildConversationModel = (lines) => {
    const wordMeta = [];

    const text = lines
        .map((line) => {
            const suffix = line.text.endsWith(" ") ? "" : " ";
            return line.text + suffix;
        })
        .join("")
        .trimStart();

    lines.forEach((line) => {
        const parts = line.text.match(/\S+\s*/g) ?? [];
        parts.forEach(() => {
            wordMeta.push({ voice: line.voice });
        });
    });

    return { text, wordMeta };
};
