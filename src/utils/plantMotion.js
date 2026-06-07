import { hashString } from "@/utils/lSystem";

export const initPlantSway = (sprite, seed = "") => {
    const hash = hashString(seed);
    const phase = ((hash % 628) / 100) * Math.PI * 2;
    const speed = 0.55 + ((hash >> 6) % 45) / 100;

    sprite.userData.sway = {
        phase,
        speed,
        rollAmp: 0.035 + ((hash >> 10) % 35) / 1000,
        offsetAmp: 0.018 + ((hash >> 14) % 22) / 1000,
        baseX: sprite.position.x,
        baseZ: sprite.position.z,
    };
};

export const updatePlantSway = (plantRoot, elapsed) => {
    if (!plantRoot) return;

    plantRoot.children.forEach((sprite) => {
        const sway = sprite.userData.sway;
        if (!sway) return;

        const t = elapsed * sway.speed + sway.phase;

        sprite.rotation.z = Math.sin(t) * sway.rollAmp;
        sprite.position.x = sway.baseX + Math.sin(t * 0.85) * sway.offsetAmp;
        sprite.position.z = sway.baseZ + Math.cos(t * 1.05) * sway.offsetAmp;
    });
};
