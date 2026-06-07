import { useEffect, useRef } from "react";
import {
    buildForestLayout,
    FOREST_FIELD_RADIUS,
    plantWorldScale,
    sampleForestDensity,
} from "@/utils/plantBillboard";

const MAP_SIZE = 420;
const FIELD_RADIUS = FOREST_FIELD_RADIUS;

const worldToCanvas = (x, z, size) => ({
    x: ((x + FIELD_RADIUS) / (FIELD_RADIUS * 2)) * size,
    y: ((z + FIELD_RADIUS) / (FIELD_RADIUS * 2)) * size,
});

const densityColor = (density) => {
    const hue = 128 - density * 58;
    const lightness = 8 + density * 22;
    return `hsl(${hue} 42% ${lightness}%)`;
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

        const center = worldToCanvas(0, 0, size);
        context.strokeStyle = "rgba(255, 255, 255, 0.18)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(center.x, center.y, (FIELD_RADIUS / (FIELD_RADIUS * 2)) * size, 0, Math.PI * 2);
        context.stroke();

        const layout = buildForestLayout(plants);

        layout.forEach((position, index) => {
            const plant = plants[index];
            const point = worldToCanvas(position.x, position.z, size);
            const scale = plantWorldScale(plant.text, plant.id);
            const radius = 3 + scale * 2.4;
            const required = position.minSpacing ?? 1.6;

            let nearest = Infinity;
            layout.forEach((other, otherIndex) => {
                if (otherIndex === index) return;
                nearest = Math.min(
                    nearest,
                    Math.hypot(position.x - other.x, position.z - other.z)
                );
            });

            const crowded = nearest < required;
            context.fillStyle = crowded
                ? "rgba(255, 96, 96, 0.92)"
                : "rgba(126, 214, 154, 0.92)";
            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = crowded
                ? "rgba(255, 180, 180, 0.7)"
                : "rgba(210, 255, 225, 0.45)";
            context.lineWidth = 1;
            context.beginPath();
            context.arc(point.x, point.y, (required / (FIELD_RADIUS * 2)) * size, 0, Math.PI * 2);
            context.stroke();
        });
    }, [plants]);

    return <canvas ref={canvasRef} aria-label="Forest placement map" />;
};

export default ForestSimMap;
