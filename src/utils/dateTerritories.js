import * as THREE from "three";
import { wrapPointToBounds } from "@/utils/gardenChunks";

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

const boundsFromBoundary = (boundary) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    boundary.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minZ = Math.min(minZ, point.z);
        maxZ = Math.max(maxZ, point.z);
    });

    return { minX, maxX, minZ, maxZ };
};

export const pointInPolygon = (point, polygon) => {
    if (!polygon?.length) return true;

    let inside = false;

    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const current = polygon[index];
        const prior = polygon[previous];
        const intersects =
            current.z > point.z !== prior.z > point.z &&
            point.x <
                ((prior.x - current.x) * (point.z - current.z)) /
                    (prior.z - current.z) +
                    current.x;

        if (intersects) inside = !inside;
    }

    return inside;
};

const WRAP_ENTRY_EPSILON = 0.2;

const segmentIntersection = (from, to, edgeStart, edgeEnd) => {
    const denom =
        (to.x - from.x) * (edgeEnd.z - edgeStart.z) -
        (to.z - from.z) * (edgeEnd.x - edgeStart.x);

    if (Math.abs(denom) < 1e-9) return null;

    const startOffsetX = edgeStart.x - from.x;
    const startOffsetZ = edgeStart.z - from.z;
    const t =
        (startOffsetX * (edgeEnd.z - edgeStart.z) -
            startOffsetZ * (edgeEnd.x - edgeStart.x)) /
        denom;
    const u =
        (startOffsetX * (to.z - from.z) - startOffsetZ * (to.x - from.x)) /
        denom;

    if (t < 0 || t > 1 || u < 0 || u > 1) return null;

    return {
        x: from.x + t * (to.x - from.x),
        z: from.z + t * (to.z - from.z),
        t,
    };
};

const findBoundaryCrossing = (from, to, polygon) => {
    const fromInside = pointInPolygon(from, polygon);
    const toInside = pointInPolygon(to, polygon);
    let crossing = null;

    for (let index = 0; index < polygon.length; index++) {
        const edgeStart = polygon[index];
        const edgeEnd = polygon[(index + 1) % polygon.length];
        const hit = segmentIntersection(from, to, edgeStart, edgeEnd);

        if (!hit) continue;

        if (fromInside && !toInside) {
            if (!crossing || hit.t < crossing.t) {
                crossing = hit;
            }
            continue;
        }

        if (!fromInside && toInside) {
            if (!crossing || hit.t > crossing.t) {
                crossing = hit;
            }
            continue;
        }

        if (!crossing || hit.t > crossing.t) {
            crossing = hit;
        }
    }

    return crossing;
};

const closestPointOnSegment = (point, start, end) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSq = dx * dx + dz * dz;

    if (lengthSq < 1e-9) {
        return {
            point: { x: start.x, z: start.z },
            distance: Math.hypot(point.x - start.x, point.z - start.z),
        };
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq
        )
    );

    const projected = {
        x: start.x + dx * t,
        z: start.z + dz * t,
    };

    return {
        point: projected,
        distance: Math.hypot(point.x - projected.x, point.z - projected.z),
    };
};

const closestBoundaryPoint = (point, boundary) => {
    let closest = null;
    let closestDistance = Infinity;

    for (let index = 0; index < boundary.length; index++) {
        const start = boundary[index];
        const end = boundary[(index + 1) % boundary.length];
        const hit = closestPointOnSegment(point, start, end);

        if (hit.distance < closestDistance) {
            closestDistance = hit.distance;
            closest = hit.point;
        }
    }

    return closest;
};

const nearestAabbEdge = (contact, bounds) => {
    const west = contact.x - bounds.minX;
    const east = bounds.maxX - contact.x;
    const south = contact.z - bounds.minZ;
    const north = bounds.maxZ - contact.z;
    const nearest = Math.min(west, east, south, north);

    if (nearest === east) return "east";
    if (nearest === west) return "west";
    if (nearest === north) return "north";
    return "south";
};

const oppositeTorusEntry = (contact, bounds) => {
    const edge = nearestAabbEdge(contact, bounds);

    if (edge === "east") {
        return {
            edge,
            x: bounds.minX + (bounds.maxX - contact.x),
            z: contact.z,
        };
    }
    if (edge === "west") {
        return {
            edge,
            x: bounds.maxX - (contact.x - bounds.minX),
            z: contact.z,
        };
    }
    if (edge === "north") {
        return {
            edge,
            x: contact.x,
            z: bounds.minZ + (bounds.maxZ - contact.z),
        };
    }
    return {
        edge,
        x: contact.x,
        z: bounds.maxZ - (contact.z - bounds.minZ),
    };
};

export const reverseFacingForWrap = (state, motion = null) => {
    const motionLength = Math.hypot(motion?.dx ?? 0, motion?.dz ?? 0);

    if (motionLength > 1e-6) {
        state.yaw = Math.atan2(motion.dx, motion.dz) + Math.PI;
    } else if (Number.isFinite(state?.yaw)) {
        state.yaw += Math.PI;
    }

    if (Number.isFinite(state?.yaw)) {
        state.yaw = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw));
    }
};

const polygonCentroid = (polygon) =>
    polygon.reduce(
        (center, vertex) => ({
            x: center.x + vertex.x / polygon.length,
            z: center.z + vertex.z / polygon.length,
        }),
        { x: 0, z: 0 }
    );

const stepAlongDirection = (point, boundary, directionX, directionZ, maxDistance = 4) => {
    const length = Math.hypot(directionX, directionZ);
    if (length < 1e-6) return false;

    const normX = directionX / length;
    const normZ = directionZ / length;

    for (let step = WRAP_ENTRY_EPSILON; step <= maxDistance; step += 0.08) {
        const candidate = {
            x: point.x + normX * step,
            z: point.z + normZ * step,
        };

        if (pointInPolygon(candidate, boundary)) {
            point.x = candidate.x;
            point.z = candidate.z;
            return true;
        }
    }

    return false;
};

const inwardDirectionForEdge = (edge) => {
    if (edge === "west") return { x: 1, z: 0 };
    if (edge === "east") return { x: -1, z: 0 };
    if (edge === "north") return { x: 0, z: 1 };
    return { x: 0, z: -1 };
};

const settleInsideTerritory = (point, boundary, bounds, edge, motionX, motionZ) => {
    if (pointInPolygon(point, boundary)) {
        return true;
    }

    const startX = point.x;
    const startZ = point.z;
    const inward = inwardDirectionForEdge(edge);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const centroid = polygonCentroid(boundary);
    const strategies = [
        () => stepAlongDirection(point, boundary, inward.x, inward.z),
        () => stepAlongDirection(point, boundary, -motionX, -motionZ),
        () => stepAlongDirection(point, boundary, motionX, motionZ),
        () => stepAlongDirection(point, boundary, centerX - startX, centerZ - startZ, 8),
        () =>
            stepAlongDirection(
                point,
                boundary,
                centroid.x - startX,
                centroid.z - startZ,
                8
            ),
    ];

    for (const strategy of strategies) {
        point.x = startX;
        point.z = startZ;
        if (strategy()) {
            return true;
        }
    }

    if (pointInPolygon(centroid, boundary)) {
        point.x = centroid.x;
        point.z = centroid.z;
        return true;
    }

    point.x = startX;
    point.z = startZ;
    return false;
};

const wrapAtBoundaryContact = (point, territory, previous, contact) => {
    const { bounds, boundary } = territory;
    if (!bounds || !boundary?.length || !contact || !previous) return null;

    const beforeX = point.x;
    const beforeZ = point.z;
    const entry = oppositeTorusEntry(contact, bounds);
    const motionX = point.x - previous.x;
    const motionZ = point.z - previous.z;

    point.x = entry.x;
    point.z = entry.z;

    if (
        !settleInsideTerritory(
            point,
            boundary,
            bounds,
            entry.edge,
            motionX,
            motionZ
        )
    ) {
        point.x = beforeX;
        point.z = beforeZ;
        return null;
    }

    if (Math.hypot(point.x - beforeX, point.z - beforeZ) < 0.05) {
        return null;
    }

    return entry.edge;
};

export const wrapPointToTerritory = (point, territory, previous = null) => {
    const bounds = territory?.bounds;
    const boundary = territory?.boundary;

    if (!bounds) return null;

    if (!boundary?.length || boundary.length < 3) {
        const beforeX = point.x;
        const beforeZ = point.z;
        wrapPointToBounds(point, bounds);
        if (Math.hypot(point.x - beforeX, point.z - beforeZ) < 0.05) {
            return null;
        }
        const centerX = (bounds.minX + bounds.maxX) / 2;
        return point.x >= centerX ? "east" : "west";
    }

    if (!previous) return null;

    const crossing = findBoundaryCrossing(previous, point, boundary);
    const contact =
        crossing ??
        (!pointInPolygon(point, boundary)
            ? closestBoundaryPoint(point, boundary)
            : null);

    if (!contact) return null;

    return wrapAtBoundaryContact(point, territory, previous, contact);
};

export const constrainTerritoryMovement = (
    point,
    territory,
    wasInsideRef,
    previousRef,
    motion = null
) => {
    const boundary = territory?.boundary;
    const bounds = territory?.bounds;

    if (!bounds) return false;

    if (!boundary?.length || boundary.length < 3) {
        const wrapEdge = wrapPointToTerritory(point, territory, previousRef?.current);
        wasInsideRef.current = true;
        if (wrapEdge) {
            reverseFacingForWrap(point, motion);
        }
        if (previousRef) {
            previousRef.current = { x: point.x, z: point.z };
        }
        return Boolean(wrapEdge);
    }

    const previous = previousRef?.current ?? null;
    const inside = pointInPolygon(point, boundary);
    let wrapEdge = null;
    const travel =
        motion ??
        (previous
            ? { dx: point.x - previous.x, dz: point.z - previous.z }
            : null);

    if (wasInsideRef.current === null) {
        wasInsideRef.current = inside;
    } else if (wasInsideRef.current && previous) {
        const crossing = findBoundaryCrossing(previous, point, boundary);
        if (crossing || !inside) {
            wrapEdge = wrapPointToTerritory(point, territory, previous);
            if (wrapEdge && pointInPolygon(point, boundary)) {
                reverseFacingForWrap(point, travel);
            } else {
                wrapEdge = null;
            }
        }
        wasInsideRef.current = pointInPolygon(point, boundary);
    } else if (inside) {
        wasInsideRef.current = true;
    }

    if (previousRef) {
        previousRef.current = { x: point.x, z: point.z };
    }

    return Boolean(wrapEdge);
};

export const computeOutermostTerritory = (plants = []) => {
    const groups = groupedByYear(plants);
    if (groups.size === 0) return null;

    const areas = yearRingAreas(groups);
    const outerYear = [...groups.keys()]
        .sort((left, right) => left.localeCompare(right))
        .at(-1);
    const groupPlants = groups.get(outerYear);
    const area = areas.get(outerYear);

    if (!groupPlants?.length || !area) return null;

    const boundary = naturalBoundary(groupPlants, area);
    if (!boundary.length) return null;

    return {
        boundary,
        bounds: boundsFromBoundary(boundary),
    };
};

export const computeOutermostTerritoryBounds = (plants = []) =>
    computeOutermostTerritory(plants)?.bounds ?? null;

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
