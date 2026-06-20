import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createCartridgeFromFile } from "@/cartridge/loadCartridge";
import styles from "@/styles/Extract.module.scss";

const Extract = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [manifestName, setManifestName] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    const runtimeRef = useRef(null);

    useEffect(
        () => () => {
            runtimeRef.current?.dispose?.();
        },
        []
    );

    const loadFile = async (file) => {
        setError("");
        setLoading(true);
        runtimeRef.current?.dispose?.();
        runtimeRef.current = null;
        setCoverUrl("");
        setLaunchUrl("");
        setManifestName("");

        try {
            const runtime = await createCartridgeFromFile(file);
            runtimeRef.current = runtime;
            setManifestName(runtime.manifest.name ?? "cartridge");
            setCoverUrl(runtime.coverUrl);
            setLaunchUrl(runtime.launchUrl);
        } catch (loadError) {
            setError(loadError.message ?? "Failed to load cartridge.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Memory vessel</p>
                    <h1 className={styles.title}>/extract</h1>
                </div>
                <Link className={styles.backLink} to="/">
                    Home
                </Link>
            </header>

            <p className={styles.copy}>
                Open a packed PNG cartridge to extract and run the embedded scene
                below.
            </p>

            <label className={styles.fileInput}>
                <span>{loading ? "Extracting..." : "Open cartridge PNG"}</span>
                <input
                    type="file"
                    accept="image/png,.png"
                    disabled={loading}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) loadFile(file);
                    }}
                />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            {coverUrl ? (
                <div className={styles.meta}>
                    <img
                        className={styles.cover}
                        src={coverUrl}
                        alt={manifestName}
                    />
                    <p className={styles.name}>{manifestName}</p>
                </div>
            ) : null}

            {launchUrl ? (
                <iframe
                    className={styles.frame}
                    src={launchUrl}
                    title={manifestName || "cartridge"}
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                />
            ) : null}
        </div>
    );
};

export default Extract;
