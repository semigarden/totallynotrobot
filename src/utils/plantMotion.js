import * as THREE from "three";
import { hashString } from "@/utils/lSystem";

export const PLANT_GROW_DURATION_MS = 2600;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

export const plantGrowFactor = (startedAt, now = performance.now()) => {
    if (!Number.isFinite(startedAt)) return 1;

    const progress = Math.min(1, (now - startedAt) / PLANT_GROW_DURATION_MS);
    return easeOutCubic(progress);
};

const sortPoint = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraUp = new THREE.Vector3();

export const initPlantSway = (sprite, seed = "") => {
    const hash = hashString(seed);
    const phase = ((hash % 628) / 100) * Math.PI * 2;
    const speed = 0.55 + ((hash >> 6) % 45) / 100;

    const sizeScale = sprite.userData.sizeScale ?? 1;

    sprite.userData.sway = {
        phase,
        speed,
        rollAmp: (0.035 + ((hash >> 10) % 35) / 1000) / Math.sqrt(sizeScale),
        offsetAmp: (0.018 + ((hash >> 14) % 22) / 1000) / Math.sqrt(sizeScale),
        baseX: sprite.position.x,
        baseZ: sprite.position.z,
    };

    if (sprite.userData.baseScale) {
        sprite.userData.sway.baseScaleX = sprite.userData.baseScale.x;
        sprite.userData.sway.baseScaleY = sprite.userData.baseScale.y;
    }
};

const syncPlantLabels = (billboard) => {
    const titleLabel = billboard.userData.titleLabel;
    if (titleLabel) {
        titleLabel.position.x = billboard.position.x;
        titleLabel.position.z = billboard.position.z;
        titleLabel.position.y = billboard.scale.y + 0.28;
        titleLabel.rotation.z = billboard.rotation.z * 0.35;
    }

    const nameLabel = billboard.userData.nameLabel;
    if (nameLabel) {
        nameLabel.position.x = billboard.position.x;
        nameLabel.position.z = billboard.position.z;
        nameLabel.position.y = 0.18;
        nameLabel.rotation.z = billboard.rotation.z * 0.2;
    }
};

const collectBillboards = (plantRoot) => {
    const billboards = [];

    plantRoot.traverse((child) => {
        if (child.userData?.sway) {
            billboards.push(child);
        }
    });

    return billboards;
};

const updatePlantAtlases = (plantRoot, elapsed, camera) => {
    if (!camera) return;

    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    plantRoot.traverse((child) => {
        if (!child.userData?.plantAtlas) return;

        const uniforms = child.material?.uniforms;
        if (!uniforms) return;

        uniforms.time.value = elapsed;
        uniforms.cameraRight.value.copy(cameraRight);
        uniforms.cameraUp.value.copy(cameraUp);
    });
};

export const updatePlantGrow = (plantRoot, growingPlants, now = performance.now()) => {
    if (!plantRoot || !growingPlants?.size) return;

    plantRoot.traverse((child) => {
        if (child.userData?.plantAtlas) {
            const growAttribute = child.geometry?.getAttribute("instanceGrow");
            const plantIds = child.userData.plantIds;
            if (!growAttribute || !Array.isArray(plantIds)) return;

            let changed = false;

            plantIds.forEach((plantId, index) => {
                const startedAt = growingPlants.get(plantId);
                if (!startedAt) return;

                const grow = plantGrowFactor(startedAt, now);
                if (growAttribute.getX(index) === grow) return;

                growAttribute.setX(index, grow);
                changed = true;

                if (grow >= 1) {
                    growingPlants.delete(plantId);
                }
            });

            if (changed) {
                growAttribute.needsUpdate = true;
            }
            return;
        }

        const plantId = child.userData?.plantId;
        const startedAt = plantId ? growingPlants.get(plantId) : null;
        if (!startedAt) return;

        const baseScale = child.userData.baseScale;
        const sway = child.userData.sway;
        if (!baseScale) return;

        const grow = plantGrowFactor(startedAt, now);
        child.scale.set(baseScale.x * grow, baseScale.y * grow, 1);

        if (sway) {
            sway.baseScaleX = baseScale.x * grow;
            sway.baseScaleY = baseScale.y * grow;
        }

        if (grow >= 1) {
            growingPlants.delete(plantId);
        }
    });
};

const sortPlantBillboards = (plantRoot, camera) => {
    const billboards = collectBillboards(plantRoot);
    const entries = billboards.map((sprite) => {
        sprite.getWorldPosition(sortPoint);
        return {
            sprite,
            dist: camera.position.distanceToSquared(sortPoint),
        };
    });

    entries.sort((a, b) => a.dist - b.dist);

    entries.forEach((entry, index) => {
        entry.sprite.renderOrder = index;
        if (entry.sprite.userData.titleLabel) {
            entry.sprite.userData.titleLabel.renderOrder = index;
        }
        if (entry.sprite.userData.nameLabel) {
            entry.sprite.userData.nameLabel.renderOrder = index;
        }
    });
};

export const updatePlantSway = (plantRoot, elapsed, camera, growingPlants = null) => {
    if (!plantRoot) return;

    updatePlantGrow(plantRoot, growingPlants);
    updatePlantAtlases(plantRoot, elapsed, camera);

    collectBillboards(plantRoot).forEach((sprite) => {
        const sway = sprite.userData.sway;
        if (!sway) return;

        const t = elapsed * sway.speed + sway.phase;

        sprite.rotation.z = Math.sin(t) * sway.rollAmp;
        sprite.position.x = sway.baseX + Math.sin(t * 0.85) * sway.offsetAmp;
        sprite.position.z = sway.baseZ + Math.cos(t * 1.05) * sway.offsetAmp;
        syncPlantLabels(sprite);
    });

    if (camera) {
        sortPlantBillboards(plantRoot, camera);
    }
};
