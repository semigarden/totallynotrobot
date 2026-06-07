import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { gardenPixelRatio } from "@/utils/gardenRenderer";

export const createGardenComposer = (renderer, scene, camera) => {
    const composer = new EffectComposer(renderer);

    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        0.52,
        0.38,
        0.68
    );
    composer.addPass(bloomPass);

    const noisePass = new FilmPass(0.28, false);
    composer.addPass(noisePass);

    composer.addPass(new OutputPass());

    return {
        composer,
        bloomPass,
        noisePass,
        resize: (width, height) => {
            const nextPixelRatio = gardenPixelRatio();
            renderer.setPixelRatio(nextPixelRatio);
            composer.setSize(width, height);
            bloomPass.resolution.set(
                width * nextPixelRatio,
                height * nextPixelRatio
            );
        },
        dispose: () => {
            composer.dispose();
        },
    };
};
