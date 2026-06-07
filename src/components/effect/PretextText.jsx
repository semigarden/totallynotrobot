import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import styles from "@/styles/PretextText.module.scss";

const FONT = '16px "Sulphur Point", sans-serif';
const LINE_HEIGHT = 26;
const ANCHOR_RADIUS = 110;
const FOCUS_RADIUS = 42;

const splitLineWords = (line) => line.match(/\S+\s*/g) ?? [];

const PretextText = ({
    text,
    wordMeta = [],
    echoLayers = {},
    className = "",
}) => {
    const containerRef = useRef(null);
    const wordRefs = useRef(new Map());
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const rafRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [activeLayers, setActiveLayers] = useState([]);
    const [activeGloss, setActiveGloss] = useState(null);

    const updateProximity = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (!mouseRef.current.active) {
            for (const el of wordRefs.current.values()) {
                el.classList.remove(
                    styles.wordAnchored,
                    styles.wordFocused,
                    styles.wordEchoLit
                );
                el.style.removeProperty("--anchor-strength");
            }
            setActiveLayers([]);
            setActiveGloss(null);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const { x: mouseX, y: mouseY } = mouseRef.current;

        let closestKey = null;
        let closestDistance = Infinity;
        const litLayers = new Set();
        let gloss = null;

        for (const [key, el] of wordRefs.current) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2 - containerRect.left;
            const centerY = rect.top + rect.height / 2 - containerRect.top;
            const distance = Math.hypot(centerX - mouseX, centerY - mouseY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestKey = key;
            }
        }

        for (const [key, el] of wordRefs.current) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2 - containerRect.left;
            const centerY = rect.top + rect.height / 2 - containerRect.top;
            const distance = Math.hypot(centerX - mouseX, centerY - mouseY);
            const anchored = distance < ANCHOR_RADIUS;
            const focused =
                distance < FOCUS_RADIUS ||
                (key === closestKey && distance < ANCHOR_RADIUS);
            const echoLayer = el.dataset.echo || "";
            const isEcho = echoLayer.length > 0;

            if (isEcho && anchored) litLayers.add(echoLayer);

            el.classList.toggle(styles.wordAnchored, anchored);
            el.classList.toggle(styles.wordFocused, focused && !isEcho && !el.dataset.wake);
            el.classList.toggle(styles.wordEchoLit, isEcho && (anchored || focused));

            if (anchored) {
                const strength = 1 - distance / ANCHOR_RADIUS;
                el.style.setProperty("--anchor-strength", strength.toFixed(3));
            } else {
                el.style.removeProperty("--anchor-strength");
            }

            if (focused && el.dataset.gloss) {
                gloss = el.dataset.gloss;
            }
        }

        setActiveLayers([...litLayers]);
        setActiveGloss(gloss);
    }, []);

    const scheduleUpdate = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            updateProximity();
        });
    }, [updateProximity]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateWidth = () => setWidth(el.getBoundingClientRect().width);
        const observer = new ResizeObserver(updateWidth);

        observer.observe(el);
        updateWidth();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const prepared = useMemo(
        () => (text ? prepareWithSegments(text, FONT) : null),
        [text]
    );

    const layout = useMemo(() => {
        if (!prepared || !width) return null;
        return layoutWithLines(prepared, width, LINE_HEIGHT);
    }, [prepared, width]);

    const handleMouseMove = (event) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        mouseRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            active: true,
        };
        scheduleUpdate();
    };

    const handleMouseLeave = () => {
        mouseRef.current.active = false;
        scheduleUpdate();
    };

    const setWordRef = (key, el) => {
        if (el) wordRefs.current.set(key, el);
        else wordRefs.current.delete(key);
    };

    let globalWordIndex = 0;
    const layerEntries = Object.entries(echoLayers);

    return (
        <div className={styles.wrapper}>
            <div
                ref={containerRef}
                className={`${styles.root} ${className}`}
                style={{ height: layout?.height }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {layout?.lines.map((line, lineIndex) => (
                    <div
                        key={lineIndex}
                        className={styles.line}
                        style={{
                            height: LINE_HEIGHT,
                            lineHeight: `${LINE_HEIGHT}px`,
                        }}
                    >
                        {splitLineWords(line.text || "\u00A0").map((word, wordIndex) => {
                            const key = `${lineIndex}-${wordIndex}`;
                            const meta = wordMeta[globalWordIndex] ?? {};
                            const phase = globalWordIndex;
                            globalWordIndex += 1;

                            const classNames = [styles.word];
                            if (meta.wake) classNames.push(styles.wordWake);
                            if (meta.echo) {
                                classNames.push(styles.wordEcho);
                                classNames.push(styles[`wordEcho_${meta.echo}`]);
                            }

                            return (
                                <span
                                    key={key}
                                    ref={(el) => setWordRef(key, el)}
                                    data-echo={meta.echo ?? ""}
                                    data-wake={meta.wake ? "true" : ""}
                                    data-gloss={meta.gloss ?? ""}
                                    className={classNames.join(" ")}
                                    style={{
                                        animationDelay: `${phase * 0.18}s`,
                                        "--breathe-duration": `${5 + (phase % 7) * 0.48}s`,
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>

            {activeGloss && (
                <div className={styles.glossReveal}>
                    <span className={styles.glossLabel}>also</span>
                    <span className={styles.glossText}>{activeGloss}</span>
                </div>
            )}

            {layerEntries.length > 0 && (
                <div className={styles.echoTracks}>
                    {layerEntries.map(([layerId, sentence]) => (
                        <div
                            key={layerId}
                            className={`${styles.echoTrack} ${styles[`echoTrack_${layerId}`]} ${
                                activeLayers.includes(layerId) ? styles.echoTrackVisible : ""
                            }`}
                            aria-hidden={!activeLayers.includes(layerId)}
                        >
                            <span className={styles.echoLabel}>{layerId}</span>
                            <span className={styles.echoSentence}>{sentence}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PretextText;
