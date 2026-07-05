import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import {
    MANIFESTO_LAYERS,
    MANIFESTO_SEGMENTS,
    buildWakeModel,
} from "@/data/manifestoWake";
import styles from "@/styles/PretextBackground.module.scss";

const FONT = '11px "Sulphur Point", sans-serif';
const LINE_HEIGHT = 19;
const FOCUS_RADIUS = 52;
const ANCHOR_RADIUS = 96;
const HORIZONTAL_PADDING = 36;
const PUNCTUATION_GAP = 5;
const FADE_IN_MS = 520;
const FADE_OUT_MS = 2800;
const PULSE_LIFE_MS = FADE_IN_MS + FADE_OUT_MS;
const FOCUS_LETTER_SPACING_AT = 0.45;

const manifesto = buildWakeModel(MANIFESTO_SEGMENTS, MANIFESTO_LAYERS);

const buildFillText = (viewportHeight, lineWidth) => {
    if (!lineWidth) return manifesto.text;

    const singleLayout = layoutWithLines(
        prepareWithSegments(manifesto.text, FONT),
        lineWidth,
        LINE_HEIGHT
    );
    const repeats = Math.max(
        3,
        Math.ceil((viewportHeight / singleLayout.height) * 1.15) + 1
    );

    return Array(repeats).fill(manifesto.text).join(" ");
};

const splitLineWords = (line) => line.match(/\S+\s*/g) ?? [];

const endsWithPunctuation = (word) => /[,.;:!?)\]·/&](?=\s*$)/.test(word);

const easeInQuad = (t) => t * t;
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

const pulseOpacity = (ageMs) => {
    if (ageMs >= PULSE_LIFE_MS) return 0;
    if (ageMs < FADE_IN_MS) {
        return easeInQuad(ageMs / FADE_IN_MS);
    }
    const t = (ageMs - FADE_IN_MS) / FADE_OUT_MS;
    return easeOutQuad(1 - t);
};

const PretextBackground = () => {
    const containerRef = useRef(null);
    const wordRefs = useRef(new Map());
    const pulseRef = useRef(new Map());
    const prevFocusedRef = useRef(new Set());
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const rafRef = useRef(null);
    const [width, setWidth] = useState(() =>
        typeof window !== "undefined"
            ? window.innerWidth - HORIZONTAL_PADDING
            : 0
    );
    const [viewportHeight, setViewportHeight] = useState(
        typeof window !== "undefined" ? window.innerHeight : 0
    );

    const applyWordVisual = useCallback((el, opacity) => {
        el.style.opacity = String(opacity);
        el.classList.toggle(
            styles.wordFocused,
            opacity >= FOCUS_LETTER_SPACING_AT
        );
    }, []);

    const computeFocus = useCallback(() => {
        const { x: mouseX, y: mouseY } = mouseRef.current;
        let closestKey = null;
        let closestDistance = Infinity;

        for (const [key, el] of wordRefs.current) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - mouseX, centerY - mouseY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestKey = key;
            }
        }

        const nextFocused = new Set();

        for (const [key, el] of wordRefs.current) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - mouseX, centerY - mouseY);
            const focused =
                distance < FOCUS_RADIUS ||
                (key === closestKey && distance < ANCHOR_RADIUS);

            if (focused) nextFocused.add(key);
        }

        return nextFocused;
    }, []);

    const syncPulses = useCallback((now) => {
        if (!mouseRef.current.active) return;

        const nextFocused = computeFocus();
        const prevFocused = prevFocusedRef.current;

        for (const key of nextFocused) {
            if (!prevFocused.has(key)) {
                pulseRef.current.set(key, now);
            }
        }

        prevFocusedRef.current = nextFocused;
    }, [computeFocus]);

    const applyVisuals = useCallback(
        (now) => {
            for (const [key, startAt] of pulseRef.current) {
                const el = wordRefs.current.get(key);
                if (!el) {
                    pulseRef.current.delete(key);
                    continue;
                }

                const age = now - startAt;

                if (age >= PULSE_LIFE_MS) {
                    pulseRef.current.delete(key);
                    applyWordVisual(el, 0);
                    continue;
                }

                applyWordVisual(el, pulseOpacity(age));
            }
        },
        [applyWordVisual]
    );

    const runFrame = useCallback(() => {
        rafRef.current = null;
        const now = performance.now();

        syncPulses(now);
        applyVisuals(now);

        if (mouseRef.current.active || pulseRef.current.size > 0) {
            rafRef.current = requestAnimationFrame(runFrame);
        }
    }, [applyVisuals, syncPulses]);

    const scheduleFrame = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(runFrame);
    }, [runFrame]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateSize = () => {
            setWidth(el.getBoundingClientRect().width);
            setViewportHeight(window.innerHeight);
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(el);
        updateSize();
        window.addEventListener("resize", updateSize);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    useEffect(() => {
        const handleMouseMove = (event) => {
            mouseRef.current = {
                x: event.clientX,
                y: event.clientY,
                active: true,
            };
            scheduleFrame();
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
            prevFocusedRef.current = new Set();
            scheduleFrame();
        };

        window.addEventListener("mousemove", handleMouseMove);
        document.documentElement.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.documentElement.removeEventListener(
                "mouseleave",
                handleMouseLeave
            );
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [scheduleFrame]);

    const fillText = useMemo(
        () => buildFillText(viewportHeight, width),
        [viewportHeight, width]
    );

    const prepared = useMemo(
        () => (fillText ? prepareWithSegments(fillText, FONT) : null),
        [fillText]
    );

    const layout = useMemo(() => {
        if (!prepared || !width) return null;
        return layoutWithLines(prepared, width, LINE_HEIGHT);
    }, [prepared, width]);

    useEffect(() => {
        pulseRef.current = new Map();
        prevFocusedRef.current = new Set();
        for (const el of wordRefs.current.values()) {
            applyWordVisual(el, 0);
        }

        let innerId = null;
        const outerId = requestAnimationFrame(() => {
            innerId = requestAnimationFrame(() => {
                scheduleFrame();
            });
        });

        return () => {
            cancelAnimationFrame(outerId);
            if (innerId !== null) cancelAnimationFrame(innerId);
        };
    }, [layout, applyWordVisual, scheduleFrame]);

    const setWordRef = (key, el) => {
        if (el) wordRefs.current.set(key, el);
        else wordRefs.current.delete(key);
    };

    return (
        <div className={styles.root} aria-hidden="true">
            <div ref={containerRef} className={styles.inner}>
                {layout?.lines.map((line, lineIndex) => {
                    const words = splitLineWords(line.text || "\u00A0");
                    const gapCount = Math.max(0, words.length - 1);
                    const lineGap =
                        width > 0 && gapCount > 0
                            ? Math.max(0, width - line.width) / gapCount
                            : 0;

                    return (
                        <div
                            key={lineIndex}
                            className={styles.line}
                            style={{
                                height: LINE_HEIGHT,
                                lineHeight: `${LINE_HEIGHT}px`,
                            }}
                        >
                            {words.map((word, wordIndex) => {
                                const key = `${lineIndex}-${wordIndex}`;
                                const afterPunct = endsWithPunctuation(word);
                                const marginRight =
                                    wordIndex < words.length - 1
                                        ? lineGap +
                                          (afterPunct ? PUNCTUATION_GAP : 0)
                                        : undefined;

                                return (
                                    <span
                                        key={key}
                                        ref={(el) => setWordRef(key, el)}
                                        className={`${styles.word} ${
                                            afterPunct ? styles.wordAfterPunct : ""
                                        }`}
                                        style={
                                            marginRight !== undefined
                                                ? { marginRight }
                                                : undefined
                                        }
                                    >
                                        {word}
                                    </span>
                                );
                            })}
                        </div>
                    );
                }) ?? null}
            </div>
        </div>
    );
};

export default PretextBackground;
