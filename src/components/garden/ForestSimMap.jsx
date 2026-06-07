import { useEffect, useRef } from "react";
import {
    FOREST_FIELD_RADIUS,
    plantWorldScale,
    sampleForestDensity,
} from "@/utils/plantBillboard";
import {
    CHUNK_SIZE,
    computeAuthoredBounds,
} from "@/utils/gardenChunks";

const MAP_SIZE = 420;
const FIELD_RADIUS = FOREST_FIELD_RADIUS;

const worldToCanvas = (x, z, size) => ({
    x: ((x + FIELD_RADIUS) / (FIELD_RADIUS * 2)) * size,
    y: ((z + FIELD_RADIUS) / (FIELD_RADIUS * 2)) * size,
});

const densityColor = (density) => {
    const lightness = 8 + density * 24;
    return `hsl(0 0% ${lightness}%)`;
};

const drawDensityField = (context, size) => {
    const step = 6;

    for (let py = 0; py < size; py += step) {
        for (let px = 0; px < size; px += step) {
            const worldX = (px / size) * FIELD_RADIUS * 2 - FIELD_RADIUS;
            const worldZ = (py / size) * FIELD_RADIUS * 2 - FIELD_RADIUS;
            const density = sampleForestDensity(worldX, worldZ);
            const color = densityColor(density);
            context.fillStyle = color;
            context.fillRect(px, py, step, step);
        }
    }
};

const drawChunkGrid = (context, size) => {
    context.strokeStyle = "rgba(255, 255, 255, 0.16)";
    context.lineWidth = 1;

    const start = Math.floor(-FIELD_RADIUS / CHUNK_SIZE) * CHUNK_SIZE;
    const end = Math.ceil(FIELD_RADIUS / CHUNK_SIZE) * CHUNK_SIZE;

    for (
        let world = start;
        world <= end;
        world += CHUNK_SIZE
    ) {
        const vertical = worldToCanvas(world, -FIELD_RADIUS, size);
        const horizontal = worldToCanvas(-FIELD_RADIUS, world, size);

        context.beginPath();
        context.moveTo(vertical.x, 0);
        context.lineTo(vertical.x, size);
        context.stroke();

        context.beginPath();
        context.moveTo(0, horizontal.y);
        context.lineTo(size, horizontal.y);
        context.stroke();
    }
};

const drawAuthoredBounds = (context, plants, size) => {
    const bounds = computeAuthoredBounds(plants);
    const topLeft = worldToCanvas(bounds.minX, bounds.minZ, size);
    const bottomRight = worldToCanvas(bounds.maxX, bounds.maxZ, size);

    context.strokeStyle = "rgba(255, 255, 255, 0.58)";
    context.lineWidth = 2;
    context.setLineDash([8, 6]);
    context.strokeRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );
    context.setLineDash([]);
};

const ForestSimMap = ({ plants = [] }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        const size = MAP_SIZE;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, size, size);

        drawDensityField(context, size);
        drawChunkGrid(context, size);

        const center = worldToCanvas(0, 0, size);
        context.strokeStyle = "rgba(255, 255, 255, 0.18)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(center.x, center.y, (FIELD_RADIUS / (FIELD_RADIUS * 2)) * size, 0, Math.PI * 2);
        context.stroke();

        drawAuthoredBounds(context, plants, size);

        plants.forEach((plant, index) => {
            const position = { x: plant.x ?? 0, z: plant.z ?? 0 };
            const point = worldToCanvas(position.x, position.z, size);
            const scale = plantWorldScale(plant.text, plant.id);
            const radius = 3 + scale * 2.4;
            const required = plant.minSpacing ?? 1.6;

            let nearest = Infinity;
            plants.forEach((other, otherIndex) => {
                if (otherIndex === index) return;
                nearest = Math.min(
                    nearest,
                    Math.hypot(
                        position.x - (other.x ?? 0),
                        position.z - (other.z ?? 0)
                    )
                );
            });

            const crowded = nearest < required;
            context.fillStyle = crowded
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(150, 150, 150, 0.92)";
            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = crowded
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(210, 210, 210, 0.45)";
            context.lineWidth = 1;
            context.beginPath();
            context.arc(point.x, point.y, (required / (FIELD_RADIUS * 2)) * size, 0, Math.PI * 2);
            context.stroke();
        });
    }, [plants]);

    return <canvas ref={canvasRef} aria-label="Forest placement map" />;
};

export default ForestSimMap;
