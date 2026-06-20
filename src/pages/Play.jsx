import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createCartridgeFromFile } from "@/cartridge/loadCartridge";
import styles from "@/styles/Play.module.scss";

const Play = () => {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const [launchUrl, setLaunchUrl] = useState("");
    const [title, setTitle] = useState("cartridge");
    const runtimeRef = useRef(null);

    useEffect(
        () => () => {
            runtimeRef.current?.dispose?.();
        },
        []
    );

    useEffect(() => {
        const source = searchParams.get("src");
        const fileName = searchParams.get("name") ?? "cartridge.png";

        if (!source) {
            setError("No cartridge source provided.");
            return;
        }

        let cancelled = false;

        const load = async () => {
            setError("");
            setLaunchUrl("");
            runtimeRef.current?.dispose?.();
            runtimeRef.current = null;

            try {
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error("Failed to load cartridge image.");
                }

                const buffer = await response.arrayBuffer();
                const file = new File([buffer], fileName, { type: "image/png" });
                const runtime = await createCartridgeFromFile(file);

                if (cancelled) {
                    runtime.dispose();
                    return;
                }

                runtimeRef.current = runtime;
                setTitle(runtime.manifest.name ?? "cartridge");
                setLaunchUrl(runtime.launchUrl);
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError.message ?? "Failed to launch cartridge.");
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
                <p className={styles.loading}>Loading cartridge...</p>
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
