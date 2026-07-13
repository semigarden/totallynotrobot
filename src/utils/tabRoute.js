export const TABS = [
    // "Manifesto",
    "Projects",
    "Gallery",
    "Connection",
];

export const DEFAULT_TAB = "Projects";

export const tabFromParam = (param) => {
    if (!param) return DEFAULT_TAB;

    const match = TABS.find((tab) => tab.toLowerCase() === param.toLowerCase());
    return match ?? DEFAULT_TAB;
};
