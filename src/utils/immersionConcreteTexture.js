import * as THREE from "three";
import { applyGardenTextureQuality } from "@/utils/gardenRenderer";
import concreteRoughUrl from "../../textures/concrete_wall_007_rough_4k.png?url";

const CONCRETE_ROUGH_URL = concreteRoughUrl;
const textureLoader = new THREE.TextureLoader();

const configureTiledTexture = (texture, repeatX, repeatY) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = THREE.SRGBColorSpace;
    applyGardenTextureQuality(texture);
    return texture;
};

export const createConcreteWallMaterial = ({
    repeatX = 2,
    repeatY = 4,
    color = 0x9a9a96,
} = {}) => {
    const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        fog: false,
    });

    textureLoader.load(
        CONCRETE_ROUGH_URL,
        (texture) => {
            material.map = configureTiledTexture(texture, repeatX, repeatY);
            material.color.set(0xffffff);
            material.needsUpdate = true;
        },
        undefined,
        (error) => {
            console.warn("Failed to load concrete wall texture:", error);
        }
    );

    return material;
};

export const disposeConcreteWallMaterial = (material) => {
    material.map?.dispose();
    material.dispose();
};
