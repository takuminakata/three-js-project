import * as THREE from 'three';
import {
    FLOOR_Y,
    ROBOT_SPEED,
    ROBOT_RADIUS,
    MOVEMENT_LERP_FACTOR,
    ROTATION_LERP_FACTOR,
    MIN_ROBOT_HEIGHT,
    MAX_ROBOT_HEIGHT,
    MAX_GROUND_RISE_PER_FRAME
} from './config.js';
import { state, keys } from './state.js';
import { isBlockedAlongAxis, getGroundHeight } from './collision.js';

/**
 * ロボットの移動処理（滑らかな移動と回転）
 */
export function updateRobotMovement() {
    const { robotModel, robotVelocity, mapBounds, mapModel } = state;
    if (!robotModel) return;

    robotVelocity.set(0, 0, 0);

    // 水平移動（X, Z軸）を処理
    if (keys.ArrowUp) robotVelocity.z -= ROBOT_SPEED;
    if (keys.ArrowDown) robotVelocity.z += ROBOT_SPEED;
    if (keys.ArrowLeft) robotVelocity.x -= ROBOT_SPEED;
    if (keys.ArrowRight) robotVelocity.x += ROBOT_SPEED;

    // 水平移動がある場合のみ回転を更新
    const horizontalVelocity = new THREE.Vector3(robotVelocity.x, 0, robotVelocity.z);
    if (horizontalVelocity.length() > 0) {
        state.robotTargetRotation = Math.atan2(horizontalVelocity.x, horizontalVelocity.z);
    }

    // Y軸移動の処理（キーの状態変化を検出）
    const currentW = keys.KeyW || keys.Space;
    const currentS = keys.KeyS;

    if (currentW && !currentS) {
        robotVelocity.y += ROBOT_SPEED;
    } else if (currentS && !currentW) {
        robotVelocity.y -= ROBOT_SPEED;
    }
    // 両方押されている場合は停止（何もしない）

    // 水平移動：壁に阻まれる軸はブロックする（もう一方の軸には影響しないので壁沿いに滑れる）
    if (!isBlockedAlongAxis(robotModel.position, 'x', robotVelocity.x, ROBOT_RADIUS, mapModel)) {
        state.robotTargetPosition.x += robotVelocity.x;
    }
    if (!isBlockedAlongAxis(robotModel.position, 'z', robotVelocity.z, ROBOT_RADIUS, mapModel)) {
        state.robotTargetPosition.z += robotVelocity.z;
    }

    // 垂直移動：壁の当たり判定は受けない（上昇すれば壁を飛び越えられる）
    state.robotTargetPosition.y += robotVelocity.y;

    // 地面の当たり判定：実際の地形の高さを検出してクリップする
    const rawGroundY = getGroundHeight(
        state.robotTargetPosition.x,
        state.robotTargetPosition.z,
        mapModel,
        mapBounds.maxY + 5
    ) ?? FLOOR_Y;

    // 壁際の厚み・角・ラフスキャン特有の凹凸を地面として誤検出すると
    // 一気に浮き上がって見えるため、1フレームあたりの上昇量を制限する
    // （下降方向は制限しない。本物の坂・階段はこの程度の上昇では引っかからない）
    state.groundY = Math.min(rawGroundY, state.groundY + MAX_GROUND_RISE_PER_FRAME);

    const minY = state.groundY + MIN_ROBOT_HEIGHT;
    const maxY = FLOOR_Y + MAX_ROBOT_HEIGHT;
    state.robotTargetPosition.y = Math.max(minY, Math.min(maxY, state.robotTargetPosition.y));

    // X/Z軸の境界制限を適用（マップ全体のAABB、壁のすり抜け防止の保険）
    state.robotTargetPosition.x = Math.max(mapBounds.minX, Math.min(mapBounds.maxX, state.robotTargetPosition.x));
    state.robotTargetPosition.z = Math.max(mapBounds.minZ, Math.min(mapBounds.maxZ, state.robotTargetPosition.z));

    // 滑らかな移動：現在位置から目標位置へ補間
    robotModel.position.lerp(state.robotTargetPosition, MOVEMENT_LERP_FACTOR);

    // 滑らかな回転：現在の回転から目標回転へ補間（最短経路で回転）
    const rotationDiff = state.robotTargetRotation - robotModel.rotation.y;
    let adjustedRotationDiff = rotationDiff;
    if (rotationDiff > Math.PI) {
        adjustedRotationDiff -= 2 * Math.PI;
    } else if (rotationDiff < -Math.PI) {
        adjustedRotationDiff += 2 * Math.PI;
    }

    robotModel.rotation.y += adjustedRotationDiff * ROTATION_LERP_FACTOR;
}

/**
 * ロボットの浮遊アニメーション（Y軸移動中は完全に無効化）
 */
export function updateRobotFloat() {
    const { robotModel, robotVelocity } = state;
    if (!robotModel || robotModel.userData.baseY === undefined) return;

    const isMovingY = Math.abs(robotVelocity.y) > 0;

    // Y軸移動が停止した瞬間に基準位置を更新
    // Y移動中はfloatが無効なのでposition.yはlerp値のみ（floatOffset含まず）
    // robotTargetPositionもリセットしてlerp残距離によるジャンプを防ぐ
    if (state.wasMovingY && !isMovingY) {
        state.robotTargetPosition.y = robotModel.position.y;
        robotModel.userData.baseY = robotModel.position.y;
    }

    // 水平移動で地面が迫り上がってきた場合、基準高さを底上げして沈み込みを防ぐ
    const minY = state.groundY + MIN_ROBOT_HEIGHT;
    if (!isMovingY && robotModel.userData.baseY < minY) {
        robotModel.userData.baseY = minY;
    }

    if (!isMovingY) {
        const floatAmplitude = robotVelocity.length() > 0 ? 0.1 : 0.2;
        const floatSpeed = 0.001;
        const floatOffset = Math.sin(Date.now() * floatSpeed) * floatAmplitude;
        robotModel.position.y = robotModel.userData.baseY + floatOffset;
    }

    state.wasMovingY = isMovingY;
}
