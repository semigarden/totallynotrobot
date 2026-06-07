const PRESETS = [
    {
        axiom: "F",
        rules: { F: "F[+F]F[-F]F" },
        angle: 25,
    },
    {
        axiom: "F",
        rules: { F: "F[+F]F[-F][F]" },
        angle: 22,
    },
    {
        axiom: "X",
        rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
        angle: 22,
    },
    {
        axiom: "F",
        rules: { F: "FF-[-F+F+F]+[+F-F-F]" },
        angle: 18,
    },
    {
        axiom: "F",
        rules: { F: "F[+F]F[-F+F]" },
        angle: 28,
    },
];

const MAX_INSTRUCTIONS = 12000;

export const hashString = (text) => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

export const expandLSystem = (axiom, rules, iterations) => {
    let current = axiom;
    for (let i = 0; i < iterations; i++) {
        let next = "";
        for (const symbol of current) {
            next += rules[symbol] ?? symbol;
            if (next.length > MAX_INSTRUCTIONS) return next.slice(0, MAX_INSTRUCTIONS);
        }
        current = next;
    }
    return current;
};

export const interpretLSystem = (instructions, angleStep, segmentLength) => {
    const segments = [];
    const stack = [];
    let x = 0;
    let y = 0;
    let angle = -90;
    let depth = 0;

    for (const symbol of instructions) {
        if (symbol === "F") {
            const radians = (angle * Math.PI) / 180;
            const nx = x + Math.cos(radians) * segmentLength;
            const ny = y + Math.sin(radians) * segmentLength;
            segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
            x = nx;
            y = ny;
        } else if (symbol === "+") {
            angle += angleStep;
        } else if (symbol === "-") {
            angle -= angleStep;
        } else if (symbol === "[") {
            stack.push({ x, y, angle, depth });
            depth += 1;
        } else if (symbol === "]") {
            const state = stack.pop();
            if (!state) continue;
            x = state.x;
            y = state.y;
            angle = state.angle;
            depth = state.depth;
        }
    }

    return segments;
};

export const normalizeSegments = (segments, padding = 8) => {
    if (segments.length === 0) {
        return {
            segments: [],
            viewBox: `0 0 40 40`,
            width: 40,
            height: 40,
        };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    segments.forEach((segment) => {
        minX = Math.min(minX, segment.x1, segment.x2);
        minY = Math.min(minY, segment.y1, segment.y2);
        maxX = Math.max(maxX, segment.x1, segment.x2);
        maxY = Math.max(maxY, segment.y1, segment.y2);
    });

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const offsetX = minX - padding;
    const offsetY = minY - padding;

    const normalized = segments.map((segment) => ({
        ...segment,
        x1: segment.x1 - offsetX,
        y1: segment.y1 - offsetY,
        x2: segment.x2 - offsetX,
        y2: segment.y2 - offsetY,
    }));

    return {
        segments: normalized,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
    };
};

export const textToPlant = (text, seed = "") => {
    const hash = hashString(`${text}:${seed}`);
    const preset = PRESETS[hash % PRESETS.length];
    const iterations = 3 + (hash % 3);
    const angle = preset.angle + ((hash >> 4) % 11) - 5;
    const segmentLength = 5 + (hash % 5);
    const instructions = expandLSystem(preset.axiom, preset.rules, iterations);
    const segments = interpretLSystem(instructions, angle, segmentLength);
    const normalized = normalizeSegments(segments);

    return {
        ...normalized,
        hash,
        iterations,
        angle,
    };
};
