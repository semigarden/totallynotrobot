import { Vector3 } from "three";
import { GARDEN_SHADE_SHIFT_GLSL } from "@/utils/gardenShiftColors";

/**
 * Glitch without tear bands or displacement jitter.
 * Directional shift via luminance shade layers.
 */
export const GardenGlitchShader = {
    name: "GardenGlitchShader",

    uniforms: {
        tDiffuse: { value: null },
        byp: { value: 0 },
        amount: { value: 0.08 },
        angle: { value: 0.02 },
        seed: { value: 0.02 },
        shadeA: { value: new Vector3(0.07, 0.13, 0.16) },
        shadeB: { value: new Vector3(0.76, 0.71, 0.79) },
        shadeC: { value: new Vector3(0.93, 0.68, 0.52) },
    },

    vertexShader: /* glsl */ `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */ `
        uniform int byp;

        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float angle;
        uniform float seed;
        uniform vec3 shadeA;
        uniform vec3 shadeB;
        uniform vec3 shadeC;

        varying vec2 vUv;

        ${GARDEN_SHADE_SHIFT_GLSL}

        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            if (byp < 1) {
                vec2 p = vUv;
                float xs = floor(gl_FragCoord.x / 0.5);
                float ys = floor(gl_FragCoord.y / 0.5);

                vec2 offset = amount * vec2(cos(angle), sin(angle));
                vec3 sampleA = texture2D(tDiffuse, p + offset).rgb;
                vec3 sampleB = texture2D(tDiffuse, p).rgb;
                vec3 sampleC = texture2D(tDiffuse, p - offset).rgb;

                vec3 color = shadeShift(sampleA, sampleB, sampleC, shadeA, shadeB, shadeC);
                gl_FragColor = vec4(color, texture2D(tDiffuse, p).a);

                vec4 snow = 200.0 * amount * vec4(rand(vec2(xs * seed, ys * seed * 50.0)) * 0.2);
                gl_FragColor = gl_FragColor + snow;
            } else {
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
        }
    `,
};
