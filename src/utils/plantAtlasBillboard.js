import * as THREE from "three";
import { hashString } from "@/utils/lSystem";
import { applyPlantTextureQuality } from "@/utils/gardenRenderer";
import { createPlantRenderAsset } from "@/utils/plantBillboard";

const MAX_ATLAS_SIZE = 4096;
const MAX_TILE_SIZE = 512;
const MIN_TILE_SIZE = 256;
const TILE_GUTTER = 4;
const ALPHA_TEST = 0.008;

const vertexShader = `
attribute vec3 instancePosition;
attribute vec2 instanceScale;
attribute vec4 instanceUvRect;
attribute vec4 instanceSway;

uniform float time;
uniform vec3 cameraRight;
uniform vec3 cameraUp;

varying vec2 vUv;

void main() {
    float t = time * instanceSway.y + instanceSway.x;
    float roll = sin(t) * instanceSway.z;
    float c = cos(roll);
    float s = sin(roll);

    vec2 local = vec2(position.x * instanceScale.x, position.y * instanceScale.y);
    vec2 rotated = vec2(
        local.x * c - local.y * s,
        local.x * s + local.y * c
    );

    vec3 base = instancePosition;
    base.x += sin(t * 0.85) * instanceSway.w;
    base.z += cos(t * 1.05) * instanceSway.w;

    vec3 worldPosition = base + cameraRight * rotated.x + cameraUp * rotated.y;
    vUv = instanceUvRect.xy + uv * instanceUvRect.zw;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D map;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < ${ALPHA_TEST.toFixed(3)}) discard;
    gl_FragColor = color;
}
`;

const plantSway = (plant, sizeScale) => {
    const hash = hashString(plant.id ?? plant.text ?? "");
    const phase = ((hash % 628) / 100) * Math.PI * 2;
    const speed = 0.55 + ((hash >> 6) % 45) / 100;
    const scale = Math.sqrt(sizeScale || 1);

    return {
        phase,
        speed,
        rollAmp: (0.035 + ((hash >> 10) % 35) / 1000) / scale,
        offsetAmp: (0.018 + ((hash >> 14) % 22) / 1000) / scale,
    };
};

const atlasTileSize = (count) => {
    const side = Math.max(1, Math.ceil(Math.sqrt(count)));
    return Math.max(
        MIN_TILE_SIZE,
        Math.min(MAX_TILE_SIZE, Math.floor(MAX_ATLAS_SIZE / side))
    );
};

const plantPosition = (plant) => ({
    x: Number.isFinite(plant?.x) ? plant.x : 0,
    z: Number.isFinite(plant?.z) ? plant.z : 0,
});

const createInstancedGeometry = (count) => {
    const geometry = new THREE.InstancedBufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            [-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0],
            3
        )
    );
    geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)
    );
    geometry.setIndex([0, 1, 2, 2, 1, 3]);
    geometry.instanceCount = count;

    return geometry;
};

export const createPlantAtlasBillboards = (plants = []) => {
    const group = new THREE.Group();
    if (plants.length === 0) return group;

    const tileSize = atlasTileSize(plants.length);
    const columns = Math.max(1, Math.ceil(Math.sqrt(plants.length)));
    const rows = Math.ceil(plants.length / columns);
    const atlas = document.createElement("canvas");
    atlas.width = columns * tileSize;
    atlas.height = rows * tileSize;

    const context = atlas.getContext("2d");
    context.clearRect(0, 0, atlas.width, atlas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const instancePositions = new Float32Array(plants.length * 3);
    const instanceScales = new Float32Array(plants.length * 2);
    const instanceUvRects = new Float32Array(plants.length * 4);
    const instanceSways = new Float32Array(plants.length * 4);

    plants.forEach((plant, index) => {
        const asset = createPlantRenderAsset(plant.text, plant.id, {
            gardenId: plant.gardenId,
            pubDate: plant.pubDate,
            at: plant.at,
        });
        const column = index % columns;
        const row = Math.floor(index / columns);
        const drawableTileSize = Math.max(1, tileSize - TILE_GUTTER * 2);
        const scale = Math.min(
            1,
            drawableTileSize / Math.max(asset.canvas.width, asset.canvas.height)
        );
        const drawWidth = Math.max(1, Math.floor(asset.canvas.width * scale));
        const drawHeight = Math.max(1, Math.floor(asset.canvas.height * scale));
        const x = column * tileSize + TILE_GUTTER;
        const y = row * tileSize + TILE_GUTTER;

        context.drawImage(asset.canvas, x, y, drawWidth, drawHeight);

        const position = plantPosition(plant);
        instancePositions.set([position.x, 0, position.z], index * 3);
        instanceScales.set([asset.worldWidth, asset.worldHeight], index * 2);
        instanceUvRects.set(
            [
                x / atlas.width,
                y / atlas.height,
                drawWidth / atlas.width,
                drawHeight / atlas.height,
            ],
            index * 4
        );

        const sway = plantSway(plant, asset.sizeScale);
        instanceSways.set(
            [sway.phase, sway.speed, sway.rollAmp, sway.offsetAmp],
            index * 4
        );
    });

    const texture = new THREE.CanvasTexture(atlas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    applyPlantTextureQuality(texture);
    texture.needsUpdate = true;

    const geometry = createInstancedGeometry(plants.length);
    geometry.setAttribute(
        "instancePosition",
        new THREE.InstancedBufferAttribute(instancePositions, 3)
    );
    geometry.setAttribute(
        "instanceScale",
        new THREE.InstancedBufferAttribute(instanceScales, 2)
    );
    geometry.setAttribute(
        "instanceUvRect",
        new THREE.InstancedBufferAttribute(instanceUvRects, 4)
    );
    geometry.setAttribute(
        "instanceSway",
        new THREE.InstancedBufferAttribute(instanceSways, 4)
    );

    const material = new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
            time: { value: 0 },
            cameraRight: { value: new THREE.Vector3(1, 0, 0) },
            cameraUp: { value: new THREE.Vector3(0, 1, 0) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.userData.plantAtlas = true;
    group.add(mesh);

    return group;
};
