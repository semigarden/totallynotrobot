import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import {
    buildWaterfallClipPath,
    buildWaterfallEdges,
    WATERFALL_SPEED,
    waterfallLayoutWidth,
} from "@/utils/waterfallEdges";
import styles from "@/styles/PretextTextWake.module.scss";

const FONT = '16px "Sulphur Point", sans-serif';
const LINE_HEIGHT = 26;
const ANCHOR_RADIUS = 110;
const FOCUS_RADIUS = 42;
const WAVE_TOP_PAD = 6;

const splitLineWords = (line) => line.match(/\S+\s*/g) ?? [];

const PretextTextWake = ({
    text,
    wordMeta = [],
    echoLayers = {},
    className = "",
    justifyLines = false,
    waveEdges = false,
    waveSpeed = WATERFALL_SPEED,
}) => {
    const containerRef = useRef(null);
    const wordRefs = useRef(new Map());
    const lineRefs = useRef(new Map());
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const rafRef = useRef(null);
    const waveRafRef = useRef(null);
    const wavePhaseRef = useRef(0);
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
            el.classList.toggle(
                styles.wordFocused,
                focused && !isEcho && !el.dataset.wake
            );
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
            if (waveRafRef.current !== null) cancelAnimationFrame(waveRafRef.current);
        };
    }, []);

    const layoutMaxWidth = useMemo(() => {
        if (!width) return 0;
        if (!waveEdges) return width;
        return waterfallLayoutWidth(width);
    }, [width, waveEdges]);

    const prepared = useMemo(
        () => (text ? prepareWithSegments(text, FONT) : null),
        [text]
    );

    const layout = useMemo(() => {
        if (!prepared || !layoutMaxWidth) return null;
        return layoutWithLines(prepared, layoutMaxWidth, LINE_HEIGHT);
    }, [prepared, layoutMaxWidth]);

    const shouldJustify = justifyLines && !waveEdges;

    useEffect(() => {
        if (!waveEdges || !layout?.lineCount || !width) return;

        const applyEdges = () => {
            const edges = buildWaterfallEdges(
                layout.lineCount,
                width,
                wavePhaseRef.current
            );

            const container = containerRef.current;
            if (container) {
                container.style.clipPath = buildWaterfallClipPath(
                    edges,
                    width,
                    LINE_HEIGHT
                );
            }

            for (let i = 0; i < edges.length; i += 1) {
                const el = lineRefs.current.get(i);
                if (!el) continue;
                el.style.marginLeft = `${edges[i].left}px`;
                el.style.marginRight = `${edges[i].right}px`;
            }
        };

        applyEdges();

        const tick = () => {
            wavePhaseRef.current += waveSpeed;
            applyEdges();
            waveRafRef.current = requestAnimationFrame(tick);
        };

        waveRafRef.current = requestAnimationFrame(tick);
        return () => {
            if (waveRafRef.current !== null) {
                cancelAnimationFrame(waveRafRef.current);
                waveRafRef.current = null;
            }
            if (containerRef.current) {
                containerRef.current.style.clipPath = "";
            }
        };
    }, [waveEdges, layout?.lineCount, width, waveSpeed]);

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
                className={`${styles.root} ${waveEdges ? styles.rootWave : ""} ${className}`}
                style={{
                    height: layout?.height
                        ? layout.height + (waveEdges ? WAVE_TOP_PAD : 0)
                        : undefined,
                    paddingTop: waveEdges ? WAVE_TOP_PAD : undefined,
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {layout?.lines.map((line, lineIndex) => {
                    const words = splitLineWords(line.text || "\u00A0");
                    const gapCount = Math.max(0, words.length - 1);
                    const initialEdges =
                        waveEdges && width
                            ? buildWaterfallEdges(layout.lineCount, width, 0)[lineIndex]
                            : null;
                    const lineWidth =
                        waveEdges && initialEdges
                            ? Math.max(0, width - initialEdges.left - initialEdges.right)
                            : width;
                    const lineGap =
                        shouldJustify && lineWidth > 0 && gapCount > 0
                            ? Math.max(0, lineWidth - line.width) / gapCount
                            : 0;

                    return (
                    <div
                        key={lineIndex}
                        ref={(el) => {
                            if (el) lineRefs.current.set(lineIndex, el);
                            else lineRefs.current.delete(lineIndex);
                        }}
                        className={`${styles.line} ${shouldJustify ? styles.lineJustify : ""} ${waveEdges ? styles.lineWave : ""}`}
                        style={{
                            height: LINE_HEIGHT,
                            lineHeight: `${LINE_HEIGHT}px`,
                            marginLeft: initialEdges?.left,
                            marginRight: initialEdges?.right,
                        }}
                    >
                        {words.map((word, wordIndex) => {
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
                                        animationDelay: `${phase * 0.22}s`,
                                        "--breathe-duration": `${5.2 + (phase % 5) * 0.55}s`,
                                        marginRight:
                                            lineGap > 0 && wordIndex < words.length - 1
                                                ? lineGap
                                                : undefined,
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                    );
                })}
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

export default PretextTextWake;
