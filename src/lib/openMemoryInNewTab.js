export const openMemoryInNewTab = (
    source,
    fileName = "memory.png",
    playPath = "/play"
) => {
    const playUrl = new URL(playPath, window.location.origin);
    playUrl.searchParams.set("src", source);
    playUrl.searchParams.set("name", fileName);

    const tab = window.open(playUrl.toString(), "_blank");

    if (!tab) {
        throw new Error("Popup blocked. Allow popups to launch memories.");
    }
};
