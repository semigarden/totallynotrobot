import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { gardenPixelRatio } from "@/utils/gardenRenderer";
import { GardenExperimentShader } from "@/utils/gardenExperimentShader";
import { ConstantGlitchPass } from "@/utils/gardenConstantGlitchPass";
import { GardenAfterimagePass } from "@/utils/gardenAfterimagePass";
import {
    GARDEN_SHIFT_SHADES,
    applyGardenShiftColors,
} from "@/utils/gardenShiftColors";

export const GARDEN_EXPERIMENTAL_PRESET = {
    afterimageDamp: 0.89,
    afterimageMoveTrail: 0.045,
    afterimageYawTrail: 0.022,
    bloomStrength: 0.52,
    bloomRadius: 0.38,
    bloomThreshold: 0.68,
    filmNoise: 0.28,
    glitchEnabled: true,
    glitchAmount: 0.035,
};

export const createGardenComposer = (
    renderer,
    scene,
    camera,
    preset = GARDEN_EXPERIMENTAL_PRESET
) => {
    const composer = new EffectComposer(renderer);

    composer.addPass(new RenderPass(scene, camera));

    const afterimagePass = new GardenAfterimagePass(preset.afterimageDamp);
    composer.addPass(afterimagePass);

    const prevPosition = new THREE.Vector3().copy(camera.position);
    const worldDelta = new THREE.Vector3();
    const right = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    let prevYaw = euler.setFromQuaternion(camera.quaternion, "YXZ").y;

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        preset.bloomStrength,
        preset.bloomRadius,
        preset.bloomThreshold
    );
    composer.addPass(bloomPass);

    const experimentPass = new ShaderPass(GardenExperimentShader);
    applyGardenShiftColors(
        experimentPass.uniforms,
        preset.shiftShades ?? GARDEN_SHIFT_SHADES
    );
    composer.addPass(experimentPass);

    const experimentBase = {
        chroma: GardenExperimentShader.uniforms.chroma.value,
        warp: GardenExperimentShader.uniforms.warp.value,
    };

    const noisePass = new FilmPass(preset.filmNoise, false);
    composer.addPass(noisePass);

    const glitchPass = new ConstantGlitchPass(preset.glitchAmount);
    applyGardenShiftColors(
        glitchPass.uniforms,
        preset.shiftShades ?? GARDEN_SHIFT_SHADES
    );
    glitchPass.enabled = preset.glitchEnabled;
    composer.addPass(glitchPass);

    composer.addPass(new OutputPass());

    const resize = (width, height) => {
        const nextPixelRatio = gardenPixelRatio();
        renderer.setPixelRatio(nextPixelRatio);
        composer.setSize(width, height);
        afterimagePass.setSize(
            width * nextPixelRatio,
            height * nextPixelRatio
        );
        bloomPass.resolution.set(
            width * nextPixelRatio,
            height * nextPixelRatio
        );
    };

    const update = (elapsed = 0) => {
        worldDelta.subVectors(camera.position, prevPosition);
        prevPosition.copy(camera.position);

        euler.setFromQuaternion(camera.quaternion, "YXZ");
        let yawDelta = euler.y - prevYaw;
        while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
        while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
        prevYaw = euler.y;

        right.set(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        if (right.lengthSq() > 1e-6) right.normalize();

        forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        if (forward.lengthSq() > 1e-6) forward.normalize();

        const moveX = worldDelta.dot(right);
        const moveY = worldDelta.dot(forward);

        // Trail behind motion: offset old frame opposite to default leading-edge ghosts.
        const trailX =
            -moveX * preset.afterimageMoveTrail +
            yawDelta * preset.afterimageYawTrail;
        const trailY = -moveY * preset.afterimageMoveTrail;

        afterimagePass.setTrailOffset(trailX, trailY);

        experimentPass.uniforms.time.value = elapsed;

        const breathe = 0.5 + Math.sin(elapsed * 0.35) * 0.5;
        experimentPass.uniforms.chroma.value =
            experimentBase.chroma * (0.85 + breathe * 0.3);
        experimentPass.uniforms.warp.value =
            experimentBase.warp * (0.9 + breathe * 0.2);

        glitchPass.advance(elapsed);
    };

    return {
        composer,
        afterimagePass,
        bloomPass,
        experimentPass,
        noisePass,
        glitchPass,
        resize,
        update,
        dispose: () => {
            composer.dispose();
        },
    };
};
