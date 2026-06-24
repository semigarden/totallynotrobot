import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createMemoryBlob } from "memory-extract";
import styles from "@/styles/Play.module.scss";

const registerMemoryPlaySession = async (pngBlob) => {
    const response = await fetch("/api/memory-play/register", {
        method: "POST",
        body: pngBlob,
        headers: {
            "Content-Type": "image/png",
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to register memory session.");
    }

    const payload = await response.json();
    return payload.playUrl ?? null;
};

const Play = () => {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    const launchUrlRef = useRef("");
    const memoryBlobRef = useRef(null);

    const revokeLaunchResources = () => {
        memoryBlobRef.current?.dispose?.();
        memoryBlobRef.current = null;

        if (launchUrlRef.current) {
            URL.revokeObjectURL(launchUrlRef.current);
            launchUrlRef.current = "";
        }

        setLaunchUrl("");
    };

    useEffect(
        () => () => {
            revokeLaunchResources();
        },
        []
    );

    useEffect(() => {
        const source = searchParams.get("src");

        if (!source) {
            setError("No memory source provided.");
            return;
        }

        let cancelled = false;

        const load = async () => {
            setError("");
            revokeLaunchResources();

            try {
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error("Failed to load memory image.");
                }

                const pngBlob = await response.blob();
                const playUrl = await registerMemoryPlaySession(pngBlob);

                if (cancelled) {
                    return;
                }

                if (playUrl) {
                    window.location.replace(
                        new URL(playUrl, window.location.origin).href
                    );
                    return;
                }

                const blob = await createMemoryBlob(pngBlob);

                if (cancelled) {
                    blob.dispose?.();
                    return;
                }

                memoryBlobRef.current = blob;
                const url = URL.createObjectURL(blob);
                launchUrlRef.current = url;
                setLaunchUrl(url);
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError.message ?? "Failed to launch memory.");
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    if (error) {
        return (
            <div className={styles.root}>
                <p className={styles.error}>{error}</p>
            </div>
        );
    }

    if (launchUrl) {
        return (
            <iframe
                className={styles.frame}
                src={launchUrl}
                title={searchParams.get("name") || "memory"}
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            />
        );
    }

    return (
        <div className={styles.root}>
            <p className={styles.loading}>Loading memory...</p>
        </div>
    );
};

export default Play;
