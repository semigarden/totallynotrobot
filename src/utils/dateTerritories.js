import * as THREE from "three";

const parsePlantDate = (plant) => {
    const value = plant?.pubDate ?? plant?.at;
    const timestamp =
        typeof value === "number" ? value : Date.parse(String(value ?? ""));

    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
};

const territoryKey = (plant) => {
    const date = parsePlantDate(plant);
    if (!date) return null;

    return String(date.getFullYear());
};

const groupedByYear = (plants) => {
    const groups = new Map();

    plants.forEach((plant) => {
        const key = territoryKey(plant);
        if (!key || !Number.isFinite(plant?.x) || !Number.isFinite(plant?.z)) {
            return;
        }

        const group = groups.get(key) ?? [];
        group.push(plant);
        groups.set(key, group);
    });

    return groups;
};

const estimateYearRadius = (plants) =>
    Math.max(5.5, Math.min(14, 3.2 + Math.sqrt(plants.length) * 2.2));

const yearRingAreas = (groups) => {
    const ringGap = 1.2;
    const areas = new Map();
    let innerRadius = 0;

    [...groups.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([year, plants]) => {
            const thickness = estimateYearRadius(plants);
            const outerRadius = innerRadius + thickness;
            areas.set(year, { innerRadius, outerRadius });
            innerRadius = outerRadius + ringGap;
        });

    return areas;
};

const territoryCenter = (plants) => {
    const center = plants.reduce(
        (acc, plant) => ({
            x: acc.x + plant.x,
            z: acc.z + plant.z,
        }),
        { x: 0, z: 0 }
    );

    center.x /= plants.length;
    center.z /= plants.length;
    return center;
};

const cross = (origin, a, b) =>
    (a.x - origin.x) * (b.z - origin.z) -
    (a.z - origin.z) * (b.x - origin.x);

const convexHull = (points) => {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.z - b.z);
    if (sorted.length <= 1) return sorted;

    const lower = [];
    sorted.forEach((point) => {
        while (
            lower.length >= 2 &&
            cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
        ) {
            lower.pop();
        }
        lower.push(point);
    });

    const upper = [];
    [...sorted].reverse().forEach((point) => {
        while (
            upper.length >= 2 &&
            cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
        ) {
            upper.pop();
        }
        upper.push(point);
    });

    lower.pop();
    upper.pop();
    return [...lower, ...upper];
};

const circleBoundary = (center, radius, count = 24) =>
    Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return {
            x: center.x + Math.cos(angle) * radius,
            z: center.z + Math.sin(angle) * radius,
        };
    });

const naturalBoundary = (plants, area) => {
    const center = territoryCenter(plants);
    const points = plants.map((plant) => ({ x: plant.x, z: plant.z }));

    if (points.length < 3) {
        const radius = points.reduce(
            (max, point) => Math.max(max, Math.hypot(point.x - center.x, point.z - center.z)),
            0
        );
        return circleBoundary(center, Math.max(3.2, radius + 2.4));
    }

    const hull = convexHull(points);
    return hull.map((point) => {
        const fromCenterX = point.x - center.x;
        const fromCenterZ = point.z - center.z;
        const centerLength = Math.hypot(fromCenterX, fromCenterZ) || 1;
        const radialLength = Math.hypot(point.x, point.z) || 1;
        const outward = radialLength < area.innerRadius + 0.8 ? 0.4 : 1;

        return {
            x: point.x + (fromCenterX / centerLength) * 2.4 + (point.x / radialLength) * outward,
            z: point.z + (fromCenterZ / centerLength) * 2.4 + (point.z / radialLength) * outward,
        };
    });
};

const TERRITORY_LINE_RADIUS = 0.012;

const createYearLabelTexture = (label) => {
    const size = 192;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, size, size);
    context.fillStyle = "rgba(255, 255, 255, 0.52)";
    context.font = "600 32px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};

const createYearLabel = (key, center) => {
    const texture = createYearLabelTexture(key);
    const geometry = new THREE.PlaneGeometry(5.2, 5.2);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(geometry, material);

    label.rotation.x = -Math.PI / 2;
    label.position.set(center.x, 0.012, center.z);
    label.renderOrder = -1;
    return label;
};

const createTerritoryMesh = (key, plants, area, { showLabel = true } = {}) => {
    const root = new THREE.Group();
    const center = territoryCenter(plants);
    const boundary = naturalBoundary(plants, area);
    const curvePoints = boundary.map(
        (point) => new THREE.Vector3(point.x, 0.028, point.z)
    );
    const curve = new THREE.CatmullRomCurve3(curvePoints, true, "centripetal");
    const geometry = new THREE.TubeGeometry(
        curve,
        Math.max(64, boundary.length * 10),
        TERRITORY_LINE_RADIUS,
        6,
        true
    );
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        depthTest: true,
    });
    const line = new THREE.Mesh(geometry, material);

    line.renderOrder = -1;
    root.add(line);
    if (showLabel) {
        root.add(createYearLabel(key, center));
    }
    return root;
};

export const createDateTerritories = (plants = [], { showLabels = true } = {}) => {
    const root = new THREE.Group();
    const groups = groupedByYear(plants);
    const areas = yearRingAreas(groups);

    groups.forEach((groupPlants, key) => {
        root.add(
            createTerritoryMesh(key, groupPlants, areas.get(key), {
                showLabel: showLabels,
            })
        );
    });

    return root;
};
