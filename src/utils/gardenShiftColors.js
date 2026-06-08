import * as THREE from "three";

/**
 * Shade inks for luminance-layered shift — not RGB channel splits or complements.
 * Each shade tints the light extracted from an offset sample, like stacked ink washes.
 */
export const GARDEN_SHIFT_SHADES = {
    /** Leading fringe — deep pond shadow */
    plus: new THREE.Vector3(0.07, 0.13, 0.16),
    /** Center — dusty mushroom neutral */
    center: new THREE.Vector3(0.76, 0.71, 0.79),
    /** Trailing fringe — washed apricot haze */
    minus: new THREE.Vector3(0.93, 0.68, 0.52),
};

export const applyGardenShiftColors = (
    uniforms,
    shades = GARDEN_SHIFT_SHADES
) => {
    uniforms.shadeA.value.copy(shades.plus);
    uniforms.shadeB.value.copy(shades.center);
    uniforms.shadeC.value.copy(shades.minus);
};

export const GARDEN_SHADE_SHIFT_GLSL = /* glsl */ `
    float shadeLuma(vec3 color) {
        return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    vec3 shadeShift(vec3 sampleA, vec3 sampleB, vec3 sampleC, vec3 shadeA, vec3 shadeB, vec3 shadeC) {
        float lA = shadeLuma(sampleA);
        float lB = shadeLuma(sampleB);
        float lC = shadeLuma(sampleC);

        vec3 ink =
            shadeA * lA +
            shadeB * lB +
            shadeC * lC;

        vec3 color = mix(ink, sampleB, 0.32);

        float ref = shadeLuma(sampleB);
        float outLuma = shadeLuma(color);
        if (outLuma > 0.001) {
            color *= ref / outLuma;
        }

        return color;
    }
`;
