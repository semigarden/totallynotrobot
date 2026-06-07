import * as THREE from "three";

const MOON_POSITION = new THREE.Vector3(16, 42, -24);
const MOON_DISK_SIZE = 4.7;

const createMoonSurfaceTexture = () => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const center = size / 2;
    const radius = size * 0.48;
    const edgeColor = "#d4d0c6";

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
    body.addColorStop(0, "#f4f0e6");
    body.addColorStop(0.65, "#e6e2d8");
    body.addColorStop(1, edgeColor);

    ctx.fillStyle = body;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
};

const createGlowTexture = (stops) => {
    const size = 512;
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
        [0, "rgba(255, 248, 235, 0.9)"],
        [0.12, "rgba(245, 238, 220, 0.45)"],
        [0.28, "rgba(210, 220, 240, 0.12)"],
        [0.5, "rgba(170, 190, 230, 0.03)"],
        [1, "rgba(120, 140, 200, 0)"],
    ]);
    moonRoot.add(
        createGlowSprite(innerGlowTexture, 10, 0.85, THREE.AdditiveBlending, 1)
    );

    const outerGlowTexture = createGlowTexture([
        [0, "rgba(220, 230, 255, 0.08)"],
        [0.2, "rgba(180, 200, 240, 0.05)"],
        [0.45, "rgba(140, 170, 220, 0.025)"],
        [0.72, "rgba(100, 130, 190, 0.01)"],
        [1, "rgba(60, 80, 140, 0)"],
    ]);
    moonRoot.add(
        createGlowSprite(outerGlowTexture, 34, 0.7, THREE.AdditiveBlending, 1)
    );

    const coronaTexture = createGlowTexture([
        [0, "rgba(160, 180, 230, 0)"],
        [0.35, "rgba(130, 155, 210, 0.015)"],
        [0.6, "rgba(100, 130, 190, 0.008)"],
        [0.82, "rgba(80, 110, 170, 0.004)"],
        [1, "rgba(50, 70, 120, 0)"],
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

    const moonLight = new THREE.DirectionalLight(0xa8bdd8, 0.62);
    moonLight.position.copy(MOON_POSITION);
    moonLight.target.position.set(0, 0, 0);
    moonRoot.add(moonLight);
    moonRoot.add(moonLight.target);

    const ambient = new THREE.AmbientLight(0x101828, 0.28);
    moonRoot.add(ambient);

    scene.add(moonRoot);

    return moonRoot;
};
