export const TABS = [
    // "Manifesto",
    "Gallery",
    "Projects",
    "Connection",
];

export const DEFAULT_TAB = "Manifesto";

export const tabFromParam = (param) => {
    if (!param) return DEFAULT_TAB;

    const match = TABS.find((tab) => tab.toLowerCase() === param.toLowerCase());
    return match ?? DEFAULT_TAB;
};
