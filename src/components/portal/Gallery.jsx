import { useMemo, useState } from "react";
import { openCartridgeInNewTab } from "@/cartridge/loadCartridge";
import styles from "@/styles/Panel.module.scss";

const galleryImages = import.meta.glob("@/gallery/*.png", {
    eager: true,
    import: "default",
});

const labelFromPath = (path) => {
    const fileName = path.split("/").pop() ?? path;
    return fileName.replace(/\.png$/i, "");
};

const Gallery = () => {
    const [error, setError] = useState("");
    const [openingLabel, setOpeningLabel] = useState("");

    const items = useMemo(
        () =>
            Object.entries(galleryImages)
                .map(([path, url]) => ({
                    path,
                    url,
                    label: labelFromPath(path),
                }))
                .sort((left, right) => left.label.localeCompare(right.label)),
        []
    );

    const handleOpen = async (item) => {
        setError("");
        setOpeningLabel(item.label);

        try {
            await openCartridgeInNewTab(item.url, `${item.label}.png`);
        } catch (openError) {
            setError(openError.message ?? "Failed to open cartridge.");
        } finally {
            setOpeningLabel("");
        }
    };

    if (items.length === 0) {
        return (
            <p className={styles.galleryEmpty}>
                Drop PNG cartridges into <code>src/gallery</code>.
            </p>
        );
    }

    return (
        <>
            {error ? <p className={styles.galleryError}>{error}</p> : null}

            <div className={styles.list}>
                {items.map((item) => (
                    <button
                        key={item.path}
                        type="button"
                        className={styles.item}
                        disabled={Boolean(openingLabel)}
                        onClick={() => handleOpen(item)}
                        title={`Open ${item.label}`}
                    >
                        <img
                            className={styles.galleryCover}
                            src={item.url}
                            alt={item.label}
                            loading="lazy"
                        />
                        <div className={styles.name}>
                            {openingLabel === item.label ? "Opening..." : item.label}
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
};

export default Gallery;
