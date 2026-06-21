import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createMemoryBlob } from "memory-extract";
import styles from "@/styles/Extract.module.scss";

const Extract = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [manifestName, setManifestName] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    const coverUrlRef = useRef("");
    const launchUrlRef = useRef("");
    const memoryBlobRef = useRef(null);

    const revokeUrls = () => {
        memoryBlobRef.current?.dispose?.();
        memoryBlobRef.current = null;

        if (coverUrlRef.current) {
            URL.revokeObjectURL(coverUrlRef.current);
            coverUrlRef.current = "";
        }

        if (launchUrlRef.current) {
            URL.revokeObjectURL(launchUrlRef.current);
            launchUrlRef.current = "";
        }
    };

    useEffect(
        () => () => {
            revokeUrls();
        },
        []
    );

    const loadFile = async (file) => {
        setError("");
        setLoading(true);
        revokeUrls();
        setCoverUrl("");
        setLaunchUrl("");
        setManifestName("");

        try {
            const blob = await createMemoryBlob(file);
            memoryBlobRef.current = blob;
            const nextCoverUrl = URL.createObjectURL(file);
            const nextLaunchUrl = URL.createObjectURL(blob);

            coverUrlRef.current = nextCoverUrl;
            launchUrlRef.current = nextLaunchUrl;
            setManifestName(file.name.replace(/\.png$/i, "") || "memory");
            setCoverUrl(nextCoverUrl);
            setLaunchUrl(nextLaunchUrl);
        } catch (loadError) {
            setError(loadError.message ?? "Failed to load memory.");
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
                <Link className={styles.backLink} to="/gallery">
                    Home
                </Link>
            </header>

            <p className={styles.copy}>
                Open a packed PNG memory to extract and run the embedded scene
                below.
            </p>

            <label className={styles.fileInput}>
                <span>{loading ? "Extracting..." : "Open memory PNG"}</span>
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
                    title={manifestName || "memory"}
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                />
            ) : null}
        </div>
    );
};

export default Extract;
