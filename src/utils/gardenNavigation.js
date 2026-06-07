import * as THREE from "three";

const FIELD_RADIUS = 36;
const PITCH_UP = -1.45;
const PITCH_DOWN = 0.75;

const applyWalkCamera = (camera, state, cameraY) => {
    state.pitch = THREE.MathUtils.clamp(state.pitch, PITCH_UP, PITCH_DOWN);
    camera.position.set(state.x, cameraY, state.z);

    const euler = new THREE.Euler(state.pitch, state.yaw, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);
};

const initWalkState = (offset, target, cameraY) => {
    const direction = new THREE.Vector3(
        target.x - offset.x,
        target.y - cameraY,
        target.z - offset.z
    ).normalize();

    return {
        x: offset.x,
        z: offset.z,
        yaw: Math.atan2(direction.x, direction.z),
        pitch: Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)),
    };
};

export const attachGardenWalkControls = ({
    camera,
    domElement,
    cameraY,
    initialOffset,
    lookTarget,
    enabled = true,
    rotateSpeed = 0.003,
    panSpeed = 0.004,
}) => {
    const state = initWalkState(initialOffset, lookTarget, cameraY);
    applyWalkCamera(camera, state, cameraY);

    let dragMode = null;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event) => {
        if (!enabled) return;

        if (event.button === 0) {
            dragMode = "rotate";
        } else if (event.button === 1 || event.button === 2) {
            dragMode = "pan";
        } else {
            return;
        }

        lastX = event.clientX;
        lastY = event.clientY;
        domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
        if (!dragMode) return;

        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;

        if (dragMode === "rotate") {
            state.yaw -= dx * rotateSpeed;
            state.pitch -= dy * rotateSpeed;
            applyWalkCamera(camera, state, cameraY);
            return;
        }

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        if (right.lengthSq() > 0.0001) right.normalize();

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        if (forward.lengthSq() > 0.0001) forward.normalize();

        const panX = (right.x * dx - forward.x * dy) * panSpeed;
        const panZ = (right.z * dx - forward.z * dy) * panSpeed;

        state.x -= panX;
        state.z -= panZ;
        applyWalkCamera(camera, state, cameraY);
    };

    const endDrag = (event) => {
        dragMode = null;
        if (event.pointerId !== undefined) {
            domElement.releasePointerCapture(event.pointerId);
        }
    };

    const onContextMenu = (event) => event.preventDefault();

    domElement.addEventListener("pointerdown", onPointerDown);
    domElement.addEventListener("pointermove", onPointerMove);
    domElement.addEventListener("pointerup", endDrag);
    domElement.addEventListener("pointercancel", endDrag);
    domElement.addEventListener("contextmenu", onContextMenu);

    return {
        getState: () => state,
        applyCamera: () => applyWalkCamera(camera, state, cameraY),
        dispose: () => {
            domElement.removeEventListener("pointerdown", onPointerDown);
            domElement.removeEventListener("pointermove", onPointerMove);
            domElement.removeEventListener("pointerup", endDrag);
            domElement.removeEventListener("pointercancel", endDrag);
            domElement.removeEventListener("contextmenu", onContextMenu);
        },
    };
};

export const clampWalkPosition = (state, maxRadius = FIELD_RADIUS) => {
    const dist = Math.hypot(state.x, state.z);
    if (dist <= maxRadius) return;

    const scale = maxRadius / dist;
    state.x *= scale;
    state.z *= scale;
};

export const attachScrollWalk = ({
    camera,
    domElement,
    speed = 0.004,
    onMove,
}) => {
    const forward = new THREE.Vector3();
    const move = new THREE.Vector3();

    const onWheel = (event) => {
        event.preventDefault();

        camera.getWorldDirection(forward);
        forward.y = 0;

        if (forward.lengthSq() < 0.0001) return;
        forward.normalize();

        const step = THREE.MathUtils.clamp(
            event.deltaY * speed,
            -0.45,
            0.45
        );
        move.copy(forward).multiplyScalar(-step);
        onMove(move);
    };

    domElement.addEventListener("wheel", onWheel, { passive: false });

    return () => {
        domElement.removeEventListener("wheel", onWheel);
    };
};
