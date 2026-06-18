import * as THREE from "three";

export const IMMERSION_CLOUD_NOISE_GLSL = /* glsl */ `
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin3(vec3 position) {
    vec3 cell = floor(position);
    vec3 local = fract(position);
    vec3 local1 = local - vec3(1.0);
    vec4 cornerX = cell.x + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 cornerY = cell.y + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 cornerZ = cell.z + vec4(0.0, 0.0, 1.0, 1.0);

    vec4 hashA = permute(permute(cornerX) + cornerY);
    vec4 hash0 = permute(hashA + cornerZ.x);
    vec4 hash1 = permute(hashA + cornerZ.z);

    vec4 gx0 = hash0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = hash1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(
        dot(g000, g000),
        dot(g010, g010),
        dot(g100, g100),
        dot(g110, g110)
    ));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;

    vec4 norm1 = taylorInvSqrt(vec4(
        dot(g001, g001),
        dot(g011, g011),
        dot(g101, g101),
        dot(g111, g111)
    ));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, local);
    float n100 = dot(g100, vec3(local1.x, local.yz));
    float n010 = dot(g010, vec3(local.x, local1.y, local.z));
    float n110 = dot(g110, vec3(local1.xy, local.z));
    float n001 = dot(g001, vec3(local.xy, local1.z));
    float n101 = dot(g101, vec3(local1.x, local.y, local1.z));
    float n011 = dot(g011, vec3(local.x, local1.yz));
    float n111 = dot(g111, local1);

    vec3 fadeCurve = fade(local);
    vec4 blendZ = mix(
        vec4(n000, n100, n010, n110),
        vec4(n001, n101, n011, n111),
        fadeCurve.z
    );
    vec2 blendY = mix(blendZ.xy, blendZ.zw, fadeCurve.y);

    return 2.2 * mix(blendY.x, blendY.y, fadeCurve.x);
}

float cloudFbm(vec3 position) {
    float value = 0.0;
    float amplitude = 0.55;
    float frequency = 1.0;

    for (int octave = 0; octave < 5; octave++) {
        value += amplitude * perlin3(position * frequency);
        frequency *= 2.03;
        amplitude *= 0.5;
    }

    return value;
}
`;

const vertexShader = /* glsl */ `
#include <fog_pars_vertex>

uniform float uBillow;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vBillow;

void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vBillow = sin(worldPosition.x * 0.08 + worldPosition.z * 0.06) * uBillow;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
}
`;

const fragmentShader = /* glsl */ `
#include <common>
#include <fog_pars_fragment>

uniform float uTime;
uniform vec3 uWind;
uniform float uNoiseScale;
uniform float uCoverage;
uniform float uSoftness;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uOffset;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vBillow;

${IMMERSION_CLOUD_NOISE_GLSL}

void main() {
    vec2 centeredUv = vUv - 0.5;
    float edgeDistance = length(centeredUv * vec2(1.0, 0.82));
    float edgeMask = 1.0 - smoothstep(0.18, 0.52, edgeDistance);

    vec3 samplePosition =
        vWorldPosition * uNoiseScale
        + uOffset
        + vec3(uTime * uWind.x, vBillow, uTime * uWind.z);

    float density = cloudFbm(samplePosition);
    density = smoothstep(uCoverage - uSoftness, uCoverage + uSoftness, density);
    density *= edgeMask;

    if (density < 0.01) {
        discard;
    }

    float shade = 0.82 + cloudFbm(samplePosition * 1.7 + vec3(4.0, 1.0, 2.0)) * 0.18;
    vec3 color = uColor * shade;
    float alpha = density * uOpacity;

    gl_FragColor = vec4(color, alpha);

    #include <fog_fragment>
}
`;

export const createImmersionCloudMaterial = ({
    color = 0x8d8d8d,
    opacity = 0.72,
    noiseScale = 0.055,
    coverage = 0.08,
    softness = 0.22,
    offset = new THREE.Vector3(),
    wind = new THREE.Vector3(0.018, 0.0, 0.008),
} = {}) =>
    new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
                uTime: { value: 0 },
                uWind: { value: wind.clone() },
                uNoiseScale: { value: noiseScale },
                uCoverage: { value: coverage },
                uSoftness: { value: softness },
                uOpacity: { value: opacity },
                uColor: { value: new THREE.Color(color) },
                uOffset: { value: offset.clone() },
                uBillow: { value: 0.35 },
            },
        ]),
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: true,
    });
