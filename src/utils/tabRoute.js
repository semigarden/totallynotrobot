export const TABS = [
    "Manifesto",
    "Garden",
    "Toolkit",
    "Projects",
    "Connection",
    "Experience",
    "Interests",
];

export const tabFromParam = (param) => {
    if (!param) return "Manifesto";

    const match = TABS.find((tab) => tab.toLowerCase() === param.toLowerCase());
    return match ?? "Manifesto";
};
