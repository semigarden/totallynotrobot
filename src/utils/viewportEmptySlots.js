const INTERACTIVE_TAGS = new Set([
    "A",
    "BUTTON",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "LABEL",
]);
const MEDIA_TAGS = new Set(["IMG", "CANVAS", "SVG", "VIDEO", "IFRAME"]);

export const isTransparentColor = (color) => {
    if (!color || color === "transparent") return true;
    const match = color.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i
    );
    if (!match) return false;
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    return alpha < 0.12;
};

const domRectToBox = (rect, pad = 0) => ({
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
});

export const rectsOverlap = (a, b, gap = 0) =>
    !(
        a.right + gap < b.left ||
        b.right + gap < a.left ||
        a.bottom + gap < b.top ||
        b.bottom + gap < a.top
    );

const mergeBoxes = (boxes) => {
    let merged = [...boxes];

    for (let pass = 0; pass < boxes.length; pass += 1) {
        let changed = false;
        const next = [];

        for (const box of merged) {
            const partnerIndex = next.findIndex((other) =>
                rectsOverlap(box, other, 0)
            );
            if (partnerIndex === -1) {
                next.push(box);
                continue;
            }

            const partner = next[partnerIndex];
            next[partnerIndex] = {
                left: Math.min(box.left, partner.left),
                top: Math.min(box.top, partner.top),
                right: Math.max(box.right, partner.right),
                bottom: Math.max(box.bottom, partner.bottom),
            };
            changed = true;
        }

        merged = next;
        if (!changed) break;
    }

    return merged;
};

const hasDirectText = (el) =>
    Array.from(el.childNodes).some(
        (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent.trim().length
    );

const isLargeTransparentShell = (el, style, rect) =>
    rect.height > window.innerHeight * 0.45 &&
    rect.width > window.innerWidth * 0.45 &&
    isTransparentColor(style.backgroundColor);

const collectBlockersFromNode = (el, blockers) => {
    if (!(el instanceof HTMLElement)) return;

    const style = window.getComputedStyle(el);
    if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        parseFloat(style.opacity) < 0.05
    ) {
        return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 14) return;

    const area = rect.width * rect.height;
    const tag = el.tagName;
    const text = (el.innerText || "").trim();
    const isInteractive =
        INTERACTIVE_TAGS.has(tag) || el.getAttribute("role") === "button";
    const isMedia = MEDIA_TAGS.has(tag);
    const opaqueBg = !isTransparentColor(style.backgroundColor);

    const isBlocker =
        isInteractive ||
        isMedia ||
        (opaqueBg && area > 320) ||
        (hasDirectText(el) && text.length > 0 && area > 480) ||
        (text.length > 0 && area > 1800 && !opaqueBg && hasDirectText(el));

    if (isBlocker && !isLargeTransparentShell(el, style, rect)) {
        blockers.push(domRectToBox(rect, 12));
        return;
    }

    for (const child of el.children) {
        collectBlockersFromNode(child, blockers);
    }
};

export const collectLayoutBlockers = (appEl = document.querySelector(".App")) => {
    if (!appEl) return [];

    const blockers = [];
    for (const child of appEl.children) {
        collectBlockersFromNode(child, blockers);
    }

    return mergeBoxes(blockers);
};

export const blockersToLocalSpace = (blockers, containerRect) =>
    blockers.map((box) => ({
        left: box.left - containerRect.left,
        top: box.top - containerRect.top,
        right: box.right - containerRect.left,
        bottom: box.bottom - containerRect.top,
    }));

const slotBox = (left, top, slotWidth, slotHeight) => ({
    left: left - slotWidth / 2,
    top: top - slotHeight / 2,
    right: left + slotWidth / 2,
    bottom: top + slotHeight / 2,
});

const minDistanceToBlockers = (point, blockers) => {
    if (blockers.length === 0) {
        return Math.hypot(point.x, point.y);
    }

    let minDist = Infinity;

    for (const box of blockers) {
        const dx = Math.max(box.left - point.x, 0, point.x - box.right);
        const dy = Math.max(box.top - point.y, 0, point.y - box.bottom);
        minDist = Math.min(minDist, Math.hypot(dx, dy));
    }

    return minDist;
};

const createSeededRandom = (seed) => {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return state / 4294967296;
    };
};

const symmetryPenalty = (x, y, innerWidth, innerHeight) => {
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    const bandX = innerWidth * 0.07;
    const bandY = innerHeight * 0.07;
    let penalty = 0;

    const dx = Math.abs(x - centerX);
    const dy = Math.abs(y - centerY);
    if (dx < bandX) penalty += ((bandX - dx) / bandX) * 38;
    if (dy < bandY) penalty += ((bandY - dy) / bandY) * 38;

    return penalty;
};

const layoutPenalty = (x, y, placed, innerWidth, innerHeight, tolerance = 22) => {
    let penalty = 0;

    for (const slot of placed) {
        if (Math.abs(x - slot.left) < tolerance) penalty += 48;
        if (Math.abs(y - slot.top) < tolerance) penalty += 48;

        const mirrorX = innerWidth - slot.left;
        const mirrorY = innerHeight - slot.top;
        if (
            Math.abs(x - mirrorX) < tolerance &&
            Math.abs(y - slot.top) < tolerance
        ) {
            penalty += 55;
        }
        if (
            Math.abs(x - slot.left) < tolerance &&
            Math.abs(y - mirrorY) < tolerance
        ) {
            penalty += 55;
        }
    }

    return penalty;
};

export const buildGapPlacements = ({
    innerWidth,
    innerHeight,
    blockerRects = [],
    slotWidth = 268,
    slotHeight = 92,
    slotMinGap = 36,
    edgeMargin = 20,
    gridStep = 76,
    maxSlots = 18,
}) => {
    if (!innerWidth || !innerHeight) return [];

    const seed =
        Math.floor(innerWidth) * 73856093 ^
        Math.floor(innerHeight) * 19349663 ^
        blockerRects.length * 83492791;
    const random = createSeededRandom(seed);

    const candidates = [];
    const minTop = edgeMargin + slotHeight / 2;
    const maxTop = innerHeight - edgeMargin - slotHeight / 2;
    const minLeft = edgeMargin + slotWidth / 2;
    const maxLeft = innerWidth - edgeMargin - slotWidth / 2;

    for (let row = 0; ; row += 1) {
        const rowStep = gridStep * (0.88 + random() * 0.28);
        const top =
            minTop +
            row * rowStep +
            (random() - 0.5) * gridStep * 0.34;
        if (top > maxTop) break;

        const stagger =
            (row % 2) * gridStep * 0.43 + (random() - 0.5) * gridStep * 0.26;

        for (let col = 0; ; col += 1) {
            const colStep = gridStep * (0.9 + random() * 0.24);
            const left =
                minLeft +
                col * colStep +
                stagger +
                (random() - 0.5) * gridStep * 0.58;
            if (left > maxLeft) break;

            const candidate = slotBox(left, top, slotWidth, slotHeight);

            if (
                candidate.left < edgeMargin ||
                candidate.top < edgeMargin ||
                candidate.right > innerWidth - edgeMargin ||
                candidate.bottom > innerHeight - edgeMargin
            ) {
                continue;
            }

            const hitsBlocker = blockerRects.some((blocker) =>
                rectsOverlap(candidate, blocker, 8)
            );
            if (hitsBlocker) continue;

            candidates.push({ left, top });
        }
    }

    const placed = [];

    while (placed.length < maxSlots && candidates.length > 0) {
        let bestIndex = -1;
        let bestScore = -Infinity;

        for (let index = 0; index < candidates.length; index += 1) {
            const { left, top } = candidates[index];
            const box = slotBox(left, top, slotWidth, slotHeight);
            const overlapsSlot = placed.some((slot) =>
                rectsOverlap(
                    box,
                    slotBox(slot.left, slot.top, slotWidth, slotHeight),
                    slotMinGap
                )
            );
            if (overlapsSlot) continue;

            const score =
                minDistanceToBlockers({ x: left, y: top }, blockerRects) -
                symmetryPenalty(left, top, innerWidth, innerHeight) -
                layoutPenalty(left, top, placed, innerWidth, innerHeight) +
                random() * 10;

            if (score > bestScore) {
                bestScore = score;
                bestIndex = index;
            }
        }

        if (bestIndex === -1) break;

        const chosen = candidates.splice(bestIndex, 1)[0];
        placed.push({
            key: `slot-${placed.length}`,
            left: chosen.left,
            top: chosen.top,
            lineCount: 3,
        });
    }

    return placed;
};
