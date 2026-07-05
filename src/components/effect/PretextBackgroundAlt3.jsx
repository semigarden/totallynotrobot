import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import {
    loadReadHaikuIndices,
    markHaikuRead,
    saveReadHaikuIndices,
} from "@/api/scifaikuRead";
import { SCIFAIKU, scifaikuPlainText } from "@/data/scifaikuTom";
import styles from "@/styles/PretextBackground.module.scss";
import {
    blockersToLocalSpace,
    buildGapPlacements,
    collectLayoutBlockers,
} from "@/utils/viewportEmptySlots";

const FILLER_FONT = '11px "Sulphur Point", sans-serif';
const FILLER_LINE_HEIGHT = 19;
const HAIKU_LINE_HEIGHT = 22;
const HORIZONTAL_PADDING = 36;
const INNER_PADDING_Y = 14;
const SLOT_WIDTH = 268;
const SLOT_HEIGHT = 92;
const PUNCTUATION_GAP = 5;
const HAIKU_HOVER_RADIUS = 88;
const SLOT_RECENT_MEMORY = 6;
const FADE_IN_MS = 520;
const FADE_OUT_MS = 5500;
const PULSE_LIFE_MS = FADE_IN_MS + FADE_OUT_MS;
const SPONTANEOUS_INTERVAL_MIN_MS = 3200;
const SPONTANEOUS_INTERVAL_MAX_MS = 8800;
const SPONTANEOUS_SLOT_MEMORY = 8;
const MAX_CONCURRENT_PULSES = 3;

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

const randomSpontaneousDelay = () =>
    SPONTANEOUS_INTERVAL_MIN_MS +
    Math.random() * (SPONTANEOUS_INTERVAL_MAX_MS - SPONTANEOUS_INTERVAL_MIN_MS);

const buildFillText = (viewportHeight, lineWidth) => {
    if (!lineWidth) return scifaikuPlainText;

    const singleLayout = layoutWithLines(
        prepareWithSegments(scifaikuPlainText, FILLER_FONT),
        lineWidth,
        FILLER_LINE_HEIGHT
    );
    const repeats = Math.max(
        3,
        Math.ceil((viewportHeight / singleLayout.height) * 1.15) + 1
    );

    return Array(repeats).fill(scifaikuPlainText).join(" ");
};

const splitLineWords = (line) => line.match(/\S+\s*/g) ?? [];

const endsWithPunctuation = (word) => /[,.;:!?)\]·/&](?=\s*$)/.test(word);

const PretextBackgroundAlt3 = () => {
    const location = useLocation();
    const containerRef = useRef(null);
    const haikuRefs = useRef(new Map());
    const pulseRef = useRef(new Map());
    const prevHoveredRef = useRef(new Set());
    const slotRecentRef = useRef(new Map());
    const slotTurnRef = useRef(new Map());
    const spontaneousRecentRef = useRef([]);
    const spontaneousTimeoutRef = useRef(null);
    const placementKeysRef = useRef([]);
    const readHaikuRef = useRef(loadReadHaikuIndices());
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
    const [blockerRects, setBlockerRects] = useState([]);
    const [slotHaikus, setSlotHaikus] = useState({});

    const innerWidth = Math.max(0, width);
    const innerHeight = Math.max(0, viewportHeight - INNER_PADDING_Y * 2);

    const measureBlockers = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const blockers = collectLayoutBlockers();
        setBlockerRects(blockersToLocalSpace(blockers, containerRect));
    }, []);

    const placements = useMemo(
        () =>
            buildGapPlacements({
                innerWidth,
                innerHeight,
                blockerRects,
                slotWidth: SLOT_WIDTH,
                slotHeight: SLOT_HEIGHT,
                maxSlots: Math.min(
                    SCIFAIKU.length,
                    Math.max(6, Math.floor(blockerRects.length * 1.4) + 4)
                ),
            }),
        [innerWidth, innerHeight, blockerRects]
    );

    placementKeysRef.current = placements.map(({ key }) => key);

    const fillText = useMemo(
        () => buildFillText(viewportHeight, innerWidth),
        [viewportHeight, innerWidth]
    );

    const prepared = useMemo(
        () => (fillText ? prepareWithSegments(fillText, FILLER_FONT) : null),
        [fillText]
    );

    const fillerLayout = useMemo(() => {
        if (!prepared || !innerWidth) return null;
        return layoutWithLines(prepared, innerWidth, FILLER_LINE_HEIGHT);
    }, [prepared, innerWidth]);

    const pickNextHaikuForSlot = useCallback((key) => {
        const recent = slotRecentRef.current.get(key) ?? [];
        const read = readHaikuRef.current;
        const allIndices = SCIFAIKU.map((_, index) => index);

        let pool = allIndices.filter(
            (index) => !read.has(index) && !recent.includes(index)
        );

        if (pool.length === 0) {
            pool = allIndices.filter((index) => !read.has(index));
        }

        if (pool.length === 0) {
            readHaikuRef.current = new Set();
            saveReadHaikuIndices(readHaikuRef.current);
            pool = allIndices.filter((index) => !recent.includes(index));
            if (pool.length === 0) {
                pool = allIndices;
            }
        }

        const turn = (slotTurnRef.current.get(key) ?? 0) + 1;
        slotTurnRef.current.set(key, turn);
        const nextIndex = pool[turn % pool.length];

        slotRecentRef.current.set(
            key,
            [nextIndex, ...recent.filter((index) => index !== nextIndex)].slice(
                0,
                SLOT_RECENT_MEMORY
            )
        );

        readHaikuRef.current = markHaikuRead(readHaikuRef.current, nextIndex);

        return nextIndex;
    }, []);

    const advanceSlotHaiku = useCallback(
        (key) => {
            const nextIndex = pickNextHaikuForSlot(key);
            setSlotHaikus((current) => ({ ...current, [key]: nextIndex }));
        },
        [pickNextHaikuForSlot]
    );

    const applyHaikuVisual = useCallback((el, opacity) => {
        el.style.opacity = String(opacity);
    }, []);

    const computeHovered = useCallback(() => {
        const { x: mouseX, y: mouseY } = mouseRef.current;
        const hovered = new Set();

        for (const [key, el] of haikuRefs.current) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - mouseX, centerY - mouseY);

            if (distance < HAIKU_HOVER_RADIUS) {
                hovered.add(key);
            }
        }

        return hovered;
    }, []);

    const applyVisuals = useCallback(
        (now) => {
            for (const [key, startAt] of pulseRef.current) {
                const el = haikuRefs.current.get(key);
                if (!el) {
                    pulseRef.current.delete(key);
                    continue;
                }

                const age = now - startAt;

                if (age >= PULSE_LIFE_MS) {
                    pulseRef.current.delete(key);
                    applyHaikuVisual(el, 0);
                    continue;
                }

                applyHaikuVisual(el, pulseOpacity(age));
            }
        },
        [applyHaikuVisual]
    );

    const runFrame = useCallback(() => {
        rafRef.current = null;
        const now = performance.now();

        if (mouseRef.current.active) {
            const nextHovered = computeHovered();
            const prevHovered = prevHoveredRef.current;

            for (const key of nextHovered) {
                if (!prevHovered.has(key)) {
                    advanceSlotHaiku(key);
                    pulseRef.current.set(key, now);
                }
            }

            prevHoveredRef.current = nextHovered;
        }

        applyVisuals(now);

        if (mouseRef.current.active || pulseRef.current.size > 0) {
            rafRef.current = requestAnimationFrame(runFrame);
        }
    }, [advanceSlotHaiku, applyVisuals, computeHovered]);

    const scheduleFrame = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(runFrame);
    }, [runFrame]);

    const pickSpontaneousSlot = useCallback(() => {
        const keys = placementKeysRef.current;
        if (keys.length === 0) return null;

        const activeKeys = new Set(pulseRef.current.keys());
        const recent = spontaneousRecentRef.current;

        let pool = keys.filter(
            (key) => !activeKeys.has(key) && !recent.includes(key)
        );

        if (pool.length === 0) {
            pool = keys.filter((key) => !activeKeys.has(key));
        }

        if (pool.length === 0) return null;

        const key = pool[Math.floor(Math.random() * pool.length)];
        spontaneousRecentRef.current = [
            key,
            ...recent.filter((slotKey) => slotKey !== key),
        ].slice(0, SPONTANEOUS_SLOT_MEMORY);

        return key;
    }, []);

    const scheduleSpontaneous = useCallback(() => {
        if (spontaneousTimeoutRef.current !== null) {
            clearTimeout(spontaneousTimeoutRef.current);
        }

        spontaneousTimeoutRef.current = setTimeout(() => {
            spontaneousTimeoutRef.current = null;

            if (
                placementKeysRef.current.length > 0 &&
                pulseRef.current.size < MAX_CONCURRENT_PULSES
            ) {
                const key = pickSpontaneousSlot();
                if (key) {
                    advanceSlotHaiku(key);
                    pulseRef.current.set(key, performance.now());
                    scheduleFrame();
                }
            }

            scheduleSpontaneous();
        }, randomSpontaneousDelay());
    }, [advanceSlotHaiku, pickSpontaneousSlot, scheduleFrame]);

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
        let innerId = null;
        const outerId = requestAnimationFrame(() => {
            innerId = requestAnimationFrame(measureBlockers);
        });

        const app = document.querySelector(".App");
        const mutationObserver =
            app &&
            new MutationObserver(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(measureBlockers);
                });
            });

        mutationObserver?.observe(app, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        window.addEventListener("resize", measureBlockers);

        return () => {
            cancelAnimationFrame(outerId);
            if (innerId !== null) cancelAnimationFrame(innerId);
            mutationObserver?.disconnect();
            window.removeEventListener("resize", measureBlockers);
        };
    }, [location.pathname, measureBlockers, width, viewportHeight]);

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
            prevHoveredRef.current = new Set();
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

    useEffect(() => {
        pulseRef.current = new Map();
        prevHoveredRef.current = new Set();
        slotRecentRef.current = new Map();
        slotTurnRef.current = new Map();
        spontaneousRecentRef.current = [];
        setSlotHaikus({});

        for (const el of haikuRefs.current.values()) {
            applyHaikuVisual(el, 0);
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
    }, [placements, applyHaikuVisual, scheduleFrame]);

    useEffect(() => {
        scheduleSpontaneous();

        return () => {
            if (spontaneousTimeoutRef.current !== null) {
                clearTimeout(spontaneousTimeoutRef.current);
                spontaneousTimeoutRef.current = null;
            }
        };
    }, [placements, scheduleSpontaneous]);

    const setHaikuRef = (key, el) => {
        if (el) haikuRefs.current.set(key, el);
        else haikuRefs.current.delete(key);
    };

    return (
        <div className={styles.root} aria-hidden="true">
            <div ref={containerRef} className={styles.inner}>
                <div className={styles.fillerLayer}>
                    {fillerLayout?.lines.map((line, lineIndex) => {
                        const words = splitLineWords(line.text || "\u00A0");
                        const gapCount = Math.max(0, words.length - 1);
                        const lineGap =
                            innerWidth > 0 && gapCount > 0
                                ? Math.max(0, innerWidth - line.width) / gapCount
                                : 0;

                        return (
                            <div
                                key={lineIndex}
                                className={styles.fillerLine}
                                style={{
                                    height: FILLER_LINE_HEIGHT,
                                    lineHeight: `${FILLER_LINE_HEIGHT}px`,
                                }}
                            >
                                {words.map((word, wordIndex) => {
                                    const afterPunct =
                                        endsWithPunctuation(word);
                                    const marginRight =
                                        wordIndex < words.length - 1
                                            ? lineGap +
                                              (afterPunct ? PUNCTUATION_GAP : 0)
                                            : undefined;

                                    return (
                                        <span
                                            key={`${lineIndex}-${wordIndex}`}
                                            className={`${styles.fillerWord} ${
                                                afterPunct
                                                    ? styles.fillerWordAfterPunct
                                                    : ""
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

                <div className={styles.haikuLayer}>
                    {placements.map(({ key, left, top }, slotIndex) => {
                        const unreadFallback = SCIFAIKU.map(
                            (_, index) => index
                        ).find((index) => !readHaikuRef.current.has(index));
                        const haikuIndex =
                            slotHaikus[key] ??
                            unreadFallback ??
                            slotIndex % SCIFAIKU.length;
                        const haiku = SCIFAIKU[haikuIndex];

                        return (
                            <div
                                key={key}
                                ref={(el) => setHaikuRef(key, el)}
                                className={styles.haikuBlock}
                                style={{ left, top }}
                            >
                                {haiku.lines.map((line, lineIndex) => (
                                    <div
                                        key={lineIndex}
                                        className={styles.haikuLine}
                                        style={{
                                            height: HAIKU_LINE_HEIGHT,
                                            lineHeight: `${HAIKU_LINE_HEIGHT}px`,
                                        }}
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PretextBackgroundAlt3;
