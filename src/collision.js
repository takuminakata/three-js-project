import * as THREE from 'three';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

// マップのような高ポリゴンメッシュに対するレイキャストをBVHで高速化する
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const raycaster = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);

const AXIS_DIRECTION = {
    x: new THREE.Vector3(1, 0, 0),
    z: new THREE.Vector3(0, 0, 1)
};
const AXIS_LATERAL = {
    x: new THREE.Vector3(0, 0, 1),
    z: new THREE.Vector3(1, 0, 0)
};

const WALL_RAY_HEIGHT_OFFSET = 0.3; // 地面すれすれでの誤判定を避けるための高さオフセット
const LATERAL_SAMPLES = [0, 0.8, -0.8]; // ロボットの幅を近似する左右のサンプル位置（半径に対する倍率）

/**
 * マップの各メッシュにBVHを構築する（マップ読み込み後に一度だけ呼ぶ）
 */
export function buildMapCollider(mapModel) {
    mapModel.traverse((child) => {
        if (!child.isMesh) return;
        try {
            child.geometry.computeBoundsTree();
        } catch (error) {
            console.warn('BVH構築に失敗したメッシュをスキップしました:', child.name, error);
        }
    });
}

/**
 * 指定した水平軸方向への移動が壁に阻まれるかどうかを判定する
 */
export function isBlockedAlongAxis(originPosition, axis, delta, radius, mapModel) {
    if (!mapModel || delta === 0) return false;

    const direction = AXIS_DIRECTION[axis].clone().multiplyScalar(Math.sign(delta));
    const lateral = AXIS_LATERAL[axis];
    const distance = Math.abs(delta) + radius;

    for (const factor of LATERAL_SAMPLES) {
        const origin = originPosition.clone();
        origin.y += WALL_RAY_HEIGHT_OFFSET;
        origin.addScaledVector(lateral, radius * factor);

        raycaster.set(origin, direction);
        raycaster.far = distance;

        if (raycaster.intersectObject(mapModel, true).length > 0) {
            return true;
        }
    }

    return false;
}

/**
 * 指定したXZ座標の直下にある地面のY座標を取得する（見つからなければnull）
 */
export function getGroundHeight(x, z, mapModel, rayStartY) {
    if (!mapModel) return null;

    raycaster.set(new THREE.Vector3(x, rayStartY, z), DOWN);
    raycaster.far = Infinity;

    const hits = raycaster.intersectObject(mapModel, true);
    return hits.length > 0 ? hits[0].point.y : null;
}
