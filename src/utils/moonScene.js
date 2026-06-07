import * as THREE from "three";
import { applyGardenTextureQuality } from "@/utils/gardenRenderer";

const MOON_POSITION = new THREE.Vector3(16, 42, -24);
const MOON_DISK_SIZE = 4.7;

const createMoonSurfaceTexture = () => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const center = size / 2;
    const radius = size * 0.48;
    const edgeColor = "#d4d4d4";

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    const body = ctx.createRadialGradient(
        center,
        center,
        radius * 0.12,
        center,
        center,
        radius
    );
    body.addColorStop(0, "#f4f4f4");
    body.addColorStop(0.65, "#e6e6e6");
    body.addColorStop(1, edgeColor);

    ctx.fillStyle = body;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    applyGardenTextureQuality(texture);
    return texture;
};

const createGlowTexture = (stops) => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const center = size / 2;
    const gradient = ctx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        size / 2
    );

    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    applyGardenTextureQuality(texture);
    return texture;
};

const createGlowSprite = (texture, scale, opacity, blending, renderOrder = 1) => {
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity,
        blending,
        depthWrite: false,
        fog: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(MOON_POSITION);
    sprite.scale.set(scale, scale, 1);
    sprite.renderOrder = renderOrder;

    return sprite;
};

export const createMoon = (scene) => {
    const moonRoot = new THREE.Group();

    const innerGlowTexture = createGlowTexture([
        [0, "rgba(255, 255, 255, 0.9)"],
        [0.12, "rgba(235, 235, 235, 0.45)"],
        [0.28, "rgba(210, 210, 210, 0.12)"],
        [0.5, "rgba(170, 170, 170, 0.03)"],
        [1, "rgba(120, 120, 120, 0)"],
    ]);
    moonRoot.add(
        createGlowSprite(innerGlowTexture, 10, 0.85, THREE.AdditiveBlending, 1)
    );

    const outerGlowTexture = createGlowTexture([
        [0, "rgba(230, 230, 230, 0.08)"],
        [0.2, "rgba(200, 200, 200, 0.05)"],
        [0.45, "rgba(165, 165, 165, 0.025)"],
        [0.72, "rgba(120, 120, 120, 0.01)"],
        [1, "rgba(70, 70, 70, 0)"],
    ]);
    moonRoot.add(
        createGlowSprite(outerGlowTexture, 34, 0.7, THREE.AdditiveBlending, 1)
    );

    const coronaTexture = createGlowTexture([
        [0, "rgba(180, 180, 180, 0)"],
        [0.35, "rgba(155, 155, 155, 0.015)"],
        [0.6, "rgba(130, 130, 130, 0.008)"],
        [0.82, "rgba(110, 110, 110, 0.004)"],
        [1, "rgba(70, 70, 70, 0)"],
    ]);
    moonRoot.add(
        createGlowSprite(coronaTexture, 58, 0.55, THREE.AdditiveBlending, 1)
    );

    const surfaceTexture = createMoonSurfaceTexture();
    const moonDisk = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: surfaceTexture,
            transparent: true,
            alphaTest: 0.02,
            fog: false,
            depthWrite: false,
        })
    );
    moonDisk.position.copy(MOON_POSITION);
    moonDisk.scale.set(MOON_DISK_SIZE, MOON_DISK_SIZE, 1);
    moonDisk.renderOrder = 2;
    moonRoot.add(moonDisk);

    const moonLight = new THREE.DirectionalLight(0xc8c8c8, 0.62);
    moonLight.position.copy(MOON_POSITION);
    moonLight.target.position.set(0, 0, 0);
    moonRoot.add(moonLight);
    moonRoot.add(moonLight.target);

    const ambient = new THREE.AmbientLight(0x181818, 0.28);
    moonRoot.add(ambient);

    scene.add(moonRoot);

    return moonRoot;
};
