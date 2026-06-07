import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import { VOICES } from "@/data/manifestoConversation";
import styles from "@/styles/PretextTextVoices.module.scss";

const FONT = '16px "Sulphur Point", sans-serif';
const LINE_HEIGHT = 26;
const ANCHOR_RADIUS = 110;
const FOCUS_RADIUS = 42;
const STILLNESS_MS = 1800;
const HOLD_INHALE_MS = 500;
const INHALE_MIN_MS = 1200;
const EXHALE_MS = 900;
const SYNC_CYCLES_NEEDED = 3;
const MOVE_THRESHOLD = 4;

const splitLineWords = (line) => line.match(/\S+\s*/g) ?? [];

const PretextTextVoices = ({ text, wordMeta = [], className = "" }) => {
    const containerRef = useRef(null);
    const wordRefs = useRef(new Map());
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const rafRef = useRef(null);
    const exhaleTimerRef = useRef(null);
    const breathRef = useRef({
        phase: "rest",
        stillSince: null,
        inhaleSince: null,
        holding: false,
        holdSince: null,
        lastX: 0,
        lastY: 0,
    });

    const [width, setWidth] = useState(0);
    const [breathPhase, setBreathPhase] = useState("rest");
    const [syncCycles, setSyncCycles] = useState(0);
    const [activeVoice, setActiveVoice] = useState(null);

    const calmLevel = Math.min(1, syncCycles / SYNC_CYCLES_NEEDED);
    const breatheScale = 1 + calmLevel * 0.55;

    const beginInhale = useCallback(() => {
        const breath = breathRef.current;
        if (breath.phase === "inhale") return;
        breath.phase = "inhale";
        breath.inhaleSince = performance.now();
        setBreathPhase("inhale");
    }, []);

    const completeBreath = useCallback(() => {
        const breath = breathRef.current;
        const inhaleDuration = breath.inhaleSince
            ? performance.now() - breath.inhaleSince
            : 0;

        if (inhaleDuration < INHALE_MIN_MS) {
            breath.phase = "rest";
            breath.inhaleSince = null;
            breath.stillSince = null;
            setBreathPhase("rest");
            return;
        }

        breath.phase = "exhale";
        breath.inhaleSince = null;
        breath.stillSince = null;
        setBreathPhase("exhale");
        setSyncCycles((count) => Math.min(SYNC_CYCLES_NEEDED, count + 1));

        if (exhaleTimerRef.current) clearTimeout(exhaleTimerRef.current);
        exhaleTimerRef.current = setTimeout(() => {
            breath.phase = "rest";
            setBreathPhase("rest");
        }, EXHALE_MS);
    }, []);

    const updateProximity = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const breath = breathRef.current;
        const phase = breath.phase;

        if (!mouseRef.current.active) {
            for (const el of wordRefs.current.values()) {
                el.classList.remove(
                    styles.wordAnchored,
                    styles.wordFocused,
                    styles.wordInhale,
                    styles.wordVoiceLit
                );
                el.style.removeProperty("--anchor-strength");
                el.style.removeProperty("--inhale-strength");
            }
            setActiveVoice(null);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const { x: mouseX, y: mouseY } = mouseRef.current;

        let closestKey = null;
        let closestDistance = Infinity;
        let voice = null;

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
            const wordVoice = el.dataset.voice || "";
            const inInhaleField = phase === "inhale" && anchored;

            if (focused && wordVoice) voice = wordVoice;

            el.classList.toggle(styles.wordInhale, inInhaleField);
            el.classList.toggle(
                styles.wordAnchored,
                anchored && (phase === "exhale" || calmLevel >= 1)
            );
            el.classList.toggle(
                styles.wordFocused,
                focused && phase !== "inhale"
            );
            el.classList.toggle(
                styles.wordVoiceLit,
                focused && wordVoice.length > 0
            );

            if (inInhaleField) {
                const strength = 1 - distance / ANCHOR_RADIUS;
                el.style.setProperty("--inhale-strength", strength.toFixed(3));
            } else {
                el.style.removeProperty("--inhale-strength");
            }

            if (anchored && (phase === "exhale" || calmLevel >= 1)) {
                const strength = 1 - distance / ANCHOR_RADIUS;
                el.style.setProperty("--anchor-strength", strength.toFixed(3));
            } else {
                el.style.removeProperty("--anchor-strength");
            }
        }

        setActiveVoice(voice);
    }, [calmLevel]);

    const scheduleUpdate = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            updateProximity();
        });
    }, [updateProximity]);

    const tickBreath = useCallback(() => {
        if (!mouseRef.current.active) return;

        const breath = breathRef.current;
        const { x, y } = mouseRef.current;
        const now = performance.now();
        const moved = Math.hypot(x - breath.lastX, y - breath.lastY);

        if (moved > MOVE_THRESHOLD) {
            if (breath.phase === "inhale") completeBreath();
            breath.stillSince = now;
            breath.lastX = x;
            breath.lastY = y;
        } else if (breath.phase === "rest") {
            if (breath.stillSince === null) breath.stillSince = now;

            if (
                breath.holding &&
                breath.holdSince &&
                now - breath.holdSince >= HOLD_INHALE_MS
            ) {
                beginInhale();
            } else if (now - breath.stillSince >= STILLNESS_MS) {
                beginInhale();
            }
        }

        scheduleUpdate();
    }, [beginInhale, completeBreath, scheduleUpdate]);

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
        let frame = 0;
        const loop = () => {
            tickBreath();
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            if (exhaleTimerRef.current) clearTimeout(exhaleTimerRef.current);
        };
    }, [tickBreath]);

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
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const breath = breathRef.current;

        if (!mouseRef.current.active) {
            breath.lastX = x;
            breath.lastY = y;
            breath.stillSince = performance.now();
        }

        mouseRef.current = { x, y, active: true };
        scheduleUpdate();
    };

    const handleMouseDown = () => {
        const breath = breathRef.current;
        breath.holding = true;
        breath.holdSince = performance.now();
        scheduleUpdate();
    };

    const handleMouseUp = () => {
        const breath = breathRef.current;
        if (breath.phase === "inhale") completeBreath();
        breath.holding = false;
        breath.holdSince = null;
        scheduleUpdate();
    };

    const handleMouseLeave = () => {
        const breath = breathRef.current;
        mouseRef.current.active = false;
        breath.phase = "rest";
        breath.stillSince = null;
        breath.inhaleSince = null;
        breath.holding = false;
        breath.holdSince = null;
        setBreathPhase("rest");
        scheduleUpdate();
    };

    const setWordRef = (key, el) => {
        if (el) wordRefs.current.set(key, el);
        else wordRefs.current.delete(key);
    };

    const rootClass = [
        styles.root,
        breathPhase === "inhale" && styles.rootInhale,
        breathPhase === "exhale" && styles.rootExhale,
        calmLevel >= 1 && styles.rootCalm,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    let globalWordIndex = 0;
    const voiceInfo = activeVoice ? VOICES[activeVoice] : null;

    return (
        <div className={styles.wrapper} style={{ "--calm-level": calmLevel }}>
            <div
                ref={containerRef}
                className={rootClass}
                style={{
                    height: layout?.height,
                    "--breathe-scale": breatheScale,
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
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
                            const duration = (5 + (phase % 7) * 0.48) * breatheScale;

                            const classNames = [styles.word];
                            if (meta.voice) {
                                classNames.push(styles.wordVoice);
                                classNames.push(styles[`wordVoice_${meta.voice}`]);
                            }

                            return (
                                <span
                                    key={key}
                                    ref={(el) => setWordRef(key, el)}
                                    data-voice={meta.voice ?? ""}
                                    className={classNames.join(" ")}
                                    style={{
                                        animationDelay: `${phase * 0.18}s`,
                                        "--breathe-duration": `${duration}s`,
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>

            {voiceInfo && (
                <div className={styles.voiceReveal}>
                    <span className={styles.voiceLabel}>{voiceInfo.label}</span>
                    <span className={styles.voiceDesc}>{voiceInfo.description}</span>
                </div>
            )}
        </div>
    );
};

export default PretextTextVoices;
