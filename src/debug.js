import * as THREE from 'three';
import { BVHHelper } from 'three-mesh-bvh';
import { DEBUG_AXES_SIZE, DEBUG_BVH_DEPTH } from './config.js';
import { state } from './state.js';

let enabled = false;
let axesHelper = null;
let bvhHelperGroup = null; // マップの各メッシュのBVHHelperをまとめたグループ

const panel = document.getElementById('debug-panel');
const coordsEl = document.getElementById('debug-coords');

function ensureAxesHelper() {
    if (!axesHelper) {
        axesHelper = new THREE.AxesHelper(DEBUG_AXES_SIZE);
    }
    return axesHelper;
}

/**
 * マップの各メッシュ用にBVHHelperを作る（マップ・BVH構築後に一度だけ）
 */
function ensureBvhHelperGroup() {
    if (bvhHelperGroup || !state.mapModel) return bvhHelperGroup;

    const group = new THREE.Group();
    group.name = 'BVHDebugHelpers';

    state.mapModel.traverse((child) => {
        if (child.isMesh && child.geometry.boundsTree) {
            group.add(new BVHHelper(child, DEBUG_BVH_DEPTH));
        }
    });

    bvhHelperGroup = group;
    return bvhHelperGroup;
}

export function isDebugEnabled() {
    return enabled;
}

export function setDebugEnabled(value) {
    enabled = value;

    if (panel) panel.classList.toggle('hidden', !enabled);
    if (!state.scene) return;

    const axes = ensureAxesHelper();
    const bvh = ensureBvhHelperGroup();

    if (enabled) {
        state.scene.add(axes);
        if (bvh) state.scene.add(bvh);
    } else {
        state.scene.remove(axes);
        if (bvh) state.scene.remove(bvh);
    }
}

export function toggleDebug() {
    setDebugEnabled(!enabled);
}

/**
 * デバッグモードのトグル操作（`キー / ボタン）を設定
 */
export function setupDebugControls() {
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Backquote') {
            toggleDebug();
        }
    });

    const toggleBtn = document.getElementById('debug-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleDebug);
    }
}

/**
 * デバッグパネルの座標表示を更新（毎フレーム呼ぶ）
 */
export function updateDebugPanel() {
    if (!enabled || !coordsEl || !state.robotModel) return;

    const p = state.robotModel.position;
    coordsEl.textContent =
        `X: ${p.x.toFixed(2)}\n` +
        `Y: ${p.y.toFixed(2)}\n` +
        `Z: ${p.z.toFixed(2)}\n` +
        `Ground: ${state.groundY.toFixed(2)}`;
}
