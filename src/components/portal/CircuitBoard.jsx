import React, { useEffect, useRef } from 'react';
import "styles/CircuitBoard.scss";

const NEON = '#b388ff';
const NEON_GLOW = 'rgba(179, 136, 255, 0.7)';
const BG = '#1a1033';
const GRID_SIZE = 32;

function getDiagonalPoint(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const step = Math.min(Math.abs(dx), Math.abs(dy));
    return {
        x: a.x + Math.sign(dx) * step,
        y: a.y + Math.sign(dy) * step
    };
}

const COMPONENT_TYPES = [
    { type: 'chip', w: 4, h: 2, label: 'U' },
    { type: 'resistor', w: 2, h: 0.7, label: 'R' },
    { type: 'capacitor', w: 1.2, h: 0.7, label: 'C' }
];

const CircuitBoard = ({ className, complexity = 40, animated = true }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Generate grid points
        const getGridPoints = (w, h, grid) => {
            const points = [];
            for (let x = grid; x < w; x += grid) {
                for (let y = grid; y < h; y += grid) {
                    points.push({ x, y });
                }
            }
            return points;
        };

        // Generate a path between two points: orthogonal, diagonal, or mixed
        const routedPath = (a, b) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            if (dx === 0 || dy === 0) return [a, b];
            const mode = Math.random();
            if (mode < 0.33) {
                if (Math.random() > 0.5) {
                    return [a, { x: b.x, y: a.y }, b];
                } else {
                    return [a, { x: a.x, y: b.y }, b];
                }
            } else if (mode < 0.66) {
                const diag = getDiagonalPoint(a, b);
                return [a, diag, b];
            } else {
                const diag = getDiagonalPoint(a, b);
                if (Math.random() > 0.5) {
                    return [a, { x: diag.x, y: a.y }, diag, b];
                } else {
                    return [a, { x: a.x, y: diag.y }, diag, b];
                }
            }
        };

        // Helper to check if two points are close (for avoiding overlap)
        const isClose = (a, b, dist = GRID_SIZE * 2) => {
            return Math.abs(a.x - b.x) < dist && Math.abs(a.y - b.y) < dist;
        };

        // Main draw function
        const drawBoard = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, width, height);

            // Get grid points
            const points = getGridPoints(width, height, GRID_SIZE);
            // Pick random pads
            const pads = [];
            for (let i = 0; i < complexity; i++) {
                pads.push(points[Math.floor(Math.random() * points.length)]);
            }

            // --- COMPONENTS ---
            // Place a few components (chips, resistors, capacitors)
            const usedPoints = [...pads];
            const components = [];
            const numComponents = Math.floor(complexity / 6);
            let compIdx = 1;
            for (let i = 0; i < numComponents; i++) {
                // Pick a random grid point not too close to pads or other components
                let pt, tries = 0;
                do {
                    pt = points[Math.floor(Math.random() * points.length)];
                    tries++;
                } while (
                    (usedPoints.some(p => isClose(p, pt, GRID_SIZE * 2.5)) ||
                    components.some(c => isClose(c, pt, GRID_SIZE * 2.5))) && tries < 20
                );
                if (tries >= 20) continue;
                usedPoints.push(pt);
                // Randomly pick a component type
                const compType = COMPONENT_TYPES[Math.floor(Math.random() * COMPONENT_TYPES.length)];
                components.push({ ...pt, ...compType, labelNum: compIdx++ });
            }

            // --- TRACES ---
            ctx.save();
            ctx.shadowColor = NEON_GLOW;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = NEON;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < pads.length - 1; i++) {
                const a = pads[i];
                const b = pads[i + 1];
                const path = routedPath(a, b);
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let j = 1; j < path.length; j++) {
                    ctx.lineTo(path[j].x, path[j].y);
                }
                ctx.stroke();
            }
            ctx.restore();

            // --- PADS/VIAS ---
            for (const pad of pads) {
                ctx.save();
                ctx.shadowColor = NEON_GLOW;
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(pad.x, pad.y, 7, 0, Math.PI * 2);
                ctx.fillStyle = NEON;
                ctx.fill();
                ctx.restore();
                // Pad center
                ctx.beginPath();
                ctx.arc(pad.x, pad.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.7;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // --- EXTRA VIA HOLES ---
            const numExtraVias = Math.floor(complexity / 2);
            for (let i = 0; i < numExtraVias; i++) {
                const pt = points[Math.floor(Math.random() * points.length)];
                // Avoid overlap with pads/components
                if (pads.some(p => isClose(p, pt, GRID_SIZE * 1.5)) || components.some(c => isClose(c, pt, GRID_SIZE * 1.5))) continue;
                ctx.save();
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.5;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.restore();
            }

            // --- COMPONENT SILHOUETTES & SILKSCREEN ---
            ctx.save();
            ctx.globalAlpha = 0.18;
            for (const comp of components) {
                ctx.save();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.fillStyle = '#fff';
                if (comp.type === 'chip') {
                    // Rounded rectangle
                    const w = comp.w * GRID_SIZE;
                    const h = comp.h * GRID_SIZE;
                    const x = comp.x - w / 2;
                    const y = comp.y - h / 2;
                    const r = GRID_SIZE * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + w - r, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                    ctx.lineTo(x + w, y + h - r);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                    ctx.lineTo(x + r, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    // Rectangle (resistor/capacitor)
                    const w = comp.w * GRID_SIZE;
                    const h = comp.h * GRID_SIZE;
                    const x = comp.x - w / 2;
                    const y = comp.y - h / 2;
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.globalAlpha = 1;
            // Silkscreen text
            ctx.font = `${Math.round(GRID_SIZE * 0.7)}px monospace`;
            ctx.fillStyle = 'rgba(255,255,255,0.32)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            for (const comp of components) {
                ctx.fillText(`${comp.label}${comp.labelNum}`, comp.x + GRID_SIZE * 0.7, comp.y - GRID_SIZE * 0.7);
            }
            ctx.restore();
        };

        drawBoard();

        if (animated) {
            let frame = 0;
            const animate = () => {
                frame++;
                const pulse = Math.sin(frame * 0.04) * 0.08 + 0.92;
                canvas.style.opacity = pulse;
                if (frame % 120 === 0) drawBoard();
                animationRef.current = requestAnimationFrame(animate);
            };
            animate();
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [complexity, animated]);

    return (
        <div className={`circuit-board ${className}`}>
            <canvas 
                ref={canvasRef}
                className="circuit-canvas"
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
};

export default CircuitBoard;
