export const TABS = [
    "Gallery",
    "Manifesto",
    "Garden",
    "Toolkit",
    "Projects",
    "Connection",
    "Experience",
    "Interests",
];

export const DEFAULT_TAB = "Gallery";

export const tabFromParam = (param) => {
    if (!param) return DEFAULT_TAB;

    const match = TABS.find((tab) => tab.toLowerCase() === param.toLowerCase());
    return match ?? DEFAULT_TAB;
};
