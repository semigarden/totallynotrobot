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

const pointerDistance = (a, b) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_DISTANCE = 28;
const TAP_MOVE_THRESHOLD = 12;

export const attachGardenWalkControls = ({
    camera,
    domElement,
    cameraY,
    initialOffset,
    lookTarget,
    enabled = true,
    rotateSpeed = 0.003,
    panSpeed = 0.004,
    pinchSpeed = 0.014,
}) => {
    const state = initWalkState(initialOffset, lookTarget, cameraY);
    applyWalkCamera(camera, state, cameraY);

    const pointers = new Map();
    const forward = new THREE.Vector3();
    let dragMode = null;
    let lastX = 0;
    let lastY = 0;
    let pinchDistance = null;
    let capturedPointerId = null;
    let lastTap = { time: 0, x: 0, y: 0 };
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    const applyPanMove = (dx, dy) => {
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        if (right.lengthSq() > 0.0001) right.normalize();

        const panForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
            camera.quaternion
        );
        panForward.y = 0;
        if (panForward.lengthSq() > 0.0001) panForward.normalize();

        const panX = (right.x * dx - panForward.x * dy) * panSpeed;
        const panZ = (right.z * dx - panForward.z * dy) * panSpeed;

        state.x -= panX;
        state.z -= panZ;
        applyWalkCamera(camera, state, cameraY);
    };

    const applyPinchMove = (deltaDistance) => {
        camera.getWorldDirection(forward);
        forward.y = 0;

        if (forward.lengthSq() < 0.0001) return;
        forward.normalize();

        const step = THREE.MathUtils.clamp(
            deltaDistance * pinchSpeed,
            -0.45,
            0.45
        );

        state.x += forward.x * step;
        state.z += forward.z * step;
        clampWalkPosition(state);
        applyWalkCamera(camera, state, cameraY);
    };

    const onPointerDown = (event) => {
        if (!enabled) return;

        pointers.set(event.pointerId, event);

        if (pointers.size === 2) {
            dragMode = "pinch";
            const [first, second] = [...pointers.values()];
            pinchDistance = pointerDistance(first, second);

            if (capturedPointerId !== null) {
                domElement.releasePointerCapture(capturedPointerId);
                capturedPointerId = null;
            }
            return;
        }

        if (pointers.size > 2) return;

        if (event.pointerType === "touch") {
            const now = performance.now();
            const isDoubleTap =
                now - lastTap.time < DOUBLE_TAP_MS &&
                Math.hypot(
                    event.clientX - lastTap.x,
                    event.clientY - lastTap.y
                ) < DOUBLE_TAP_DISTANCE;

            dragMode = isDoubleTap ? "pan" : "rotate";
            touchStartX = event.clientX;
            touchStartY = event.clientY;
            touchMoved = false;
        } else if (event.button === 0) {
            dragMode = "rotate";
        } else if (event.button === 1 || event.button === 2) {
            dragMode = "pan";
        } else {
            pointers.delete(event.pointerId);
            return;
        }

        lastX = event.clientX;
        lastY = event.clientY;
        domElement.setPointerCapture(event.pointerId);
        capturedPointerId = event.pointerId;
    };

    const onPointerMove = (event) => {
        if (!pointers.has(event.pointerId)) return;

        pointers.set(event.pointerId, event);

        if (dragMode === "pinch" && pointers.size >= 2) {
            if (event.pointerType === "touch") {
                event.preventDefault();
            }

            const [first, second] = [...pointers.values()];
            const distance = pointerDistance(first, second);

            if (pinchDistance !== null) {
                const delta = distance - pinchDistance;
                if (Math.abs(delta) > 0.5) {
                    applyPinchMove(delta);
                }
            }

            pinchDistance = distance;
            return;
        }

        if (!dragMode || dragMode === "pinch") return;

        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;

        if (
            event.pointerType === "touch" &&
            dragMode === "rotate" &&
            !touchMoved
        ) {
            const totalMove = Math.hypot(
                event.clientX - touchStartX,
                event.clientY - touchStartY
            );
            if (totalMove > TAP_MOVE_THRESHOLD) {
                touchMoved = true;
            }
        }

        if (dragMode === "rotate") {
            state.yaw -= dx * rotateSpeed;
            state.pitch -= dy * rotateSpeed;
            applyWalkCamera(camera, state, cameraY);
            return;
        }

        applyPanMove(dx, dy);
    };

    const endDrag = (event) => {
        if (
            event.pointerType === "touch" &&
            dragMode === "rotate" &&
            pointers.size === 1 &&
            !touchMoved
        ) {
            lastTap = {
                time: performance.now(),
                x: event.clientX,
                y: event.clientY,
            };
        }

        pointers.delete(event.pointerId);

        if (pointers.size < 2) {
            pinchDistance = null;
            if (dragMode === "pinch") {
                dragMode = null;
            }
        }

        if (pointers.size === 0) {
            dragMode = null;
        }

        if (capturedPointerId === event.pointerId) {
            domElement.releasePointerCapture(event.pointerId);
            capturedPointerId = null;
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
