import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createMemoryBlob } from "memory-extract";
import styles from "@/styles/Play.module.scss";

const Play = () => {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    const [title, setTitle] = useState("memory");
    const launchUrlRef = useRef("");
    const memoryBlobRef = useRef(null);

    useEffect(
        () => () => {
            memoryBlobRef.current?.dispose?.();
            if (launchUrlRef.current) {
                URL.revokeObjectURL(launchUrlRef.current);
            }
        },
        []
    );

    useEffect(() => {
        const source = searchParams.get("src");
        const fileName = searchParams.get("name") ?? "memory.png";

        if (!source) {
            setError("No memory source provided.");
            return;
        }

        let cancelled = false;

        const load = async () => {
            setError("");
            setLaunchUrl("");

            memoryBlobRef.current?.dispose?.();
            memoryBlobRef.current = null;

            if (launchUrlRef.current) {
                URL.revokeObjectURL(launchUrlRef.current);
                launchUrlRef.current = "";
            }

            try {
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error("Failed to load memory image.");
                }

                const blob = await createMemoryBlob(await response.blob());

                if (cancelled) {
                    blob.dispose?.();
                    return;
                }

                memoryBlobRef.current = blob;
                const url = URL.createObjectURL(blob);
                launchUrlRef.current = url;
                setTitle(fileName.replace(/\.png$/i, "") || "memory");
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

    if (!launchUrl) {
        return (
            <div className={styles.root}>
                <p className={styles.loading}>Loading memory...</p>
            </div>
        );
    }

    return (
        <iframe
            className={styles.frame}
            src={launchUrl}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        />
    );
};

export default Play;
