const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const smoothNoise = (t) => {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
};

const fbm = (t, octaves = 4) => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let total = 0;

    for (let o = 0; o < octaves; o += 1) {
        value += smoothNoise(t * frequency) * amplitude;
        total += amplitude;
        amplitude *= 0.48;
        frequency *= 2.17;
    }

    return value / total;
};

export const WATERFALL_SPEED = 0.01;

export const WATERFALL_LAYOUT_RATIO = 1;

const STREAM_HALF = 0.47;
const STREAM_MIN_HALF = 0.42;
const STREAM_MAX_HALF = 0.495;
const STREAM_DRIFT = 0.08;
const STREAM_WIDTH_SWING = 0.1;

export const buildWaterfallEdges = (lineCount, containerWidth, phase = 0) => {
    if (!lineCount || !containerWidth) return [];

    const edges = [];
    let center = containerWidth * 0.5;
    let halfWidth = containerWidth * STREAM_HALF;
    const drift = containerWidth * STREAM_DRIFT;
    const widthSwing = containerWidth * STREAM_WIDTH_SWING;

    for (let i = 0; i < lineCount; i += 1) {
        const y = i * 0.31 - phase * 0.22;
        const yFine = i * 0.82 - phase * 0.38;

        const targetCenter =
            containerWidth * 0.5 +
            (fbm(y * 0.9 + 2.4, 3) - 0.5) * drift * 2 +
            (fbm(yFine + 8.1, 2) - 0.5) * drift * 0.55;

        const targetHalf =
            containerWidth * STREAM_HALF +
            (fbm(y * 1.15 + 5.7, 4) - 0.5) * widthSwing +
            (fbm(yFine * 1.6 + 1.3, 2) - 0.5) * widthSwing * 0.35;

        const fall = i / Math.max(lineCount - 1, 1);
        const cohesion = 0.74 - fall * 0.08;
        const widthCohesion = 0.7 - fall * 0.1;

        center = center * cohesion + targetCenter * (1 - cohesion);
        halfWidth = halfWidth * widthCohesion + targetHalf * (1 - widthCohesion);

        const minHalf = containerWidth * STREAM_MIN_HALF;
        const maxHalf = containerWidth * STREAM_MAX_HALF;
        halfWidth = Math.min(maxHalf, Math.max(minHalf, halfWidth));

        const left = Math.max(0, center - halfWidth);
        const right = Math.max(0, containerWidth - center - halfWidth);

        edges.push({ left, right });
    }

    return edges;
};

export const buildWaterfallClipPath = (edges, containerWidth, lineHeight) => {
    if (!edges.length) return "none";

    const topPad = 6;
    const bottomPad = 4;
    const height = edges.length * lineHeight;
    const points = [];

    points.push(`${edges[0].left}px ${-topPad}px`);
    points.push(`${containerWidth - edges[0].right}px ${-topPad}px`);

    for (let i = 0; i < edges.length - 1; i += 1) {
        points.push(`${containerWidth - edges[i].right}px ${(i + 1) * lineHeight}px`);
    }

    points.push(
        `${containerWidth - edges[edges.length - 1].right}px ${height + bottomPad}px`
    );
    points.push(`${edges[edges.length - 1].left}px ${height + bottomPad}px`);

    for (let i = edges.length - 1; i >= 0; i -= 1) {
        points.push(`${edges[i].left}px ${i * lineHeight}px`);
    }

    return `polygon(${points.join(", ")})`;
};

export const waterfallLayoutWidth = (containerWidth) =>
    containerWidth * WATERFALL_LAYOUT_RATIO;
