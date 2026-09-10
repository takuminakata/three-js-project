import * as THREE from 'three';
import { FLOOR_Y, INITIAL_MAP_BOUNDS } from './config.js';

// アプリ全体で共有される可変状態
export const state = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,

    mapModel: null,
    robotModel: null,

    lastLogTime: 0,

    // 滑らかな移動と回転のための変数
    robotVelocity: new THREE.Vector3(),
    robotTargetPosition: new THREE.Vector3(),
    robotTargetRotation: 0,
    wasMovingY: false, // 前フレームでY軸移動していたかどうか
    groundY: FLOOR_Y, // 直近フレームで検出したロボット直下の地面の高さ

    // ゲーム関連
    gameState: 'idle', // 'idle', 'playing', 'clear', 'failed'
    targetBall: null,
    countdownInterval: null,
    resultTimeoutId: null, // 結果表示中の自動消去タイマー（リスタート時にキャンセルする用）
    gameStartTime: 0,

    mapBounds: { ...INITIAL_MAP_BOUNDS }
};

// キーボード入力の状態管理
export const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,    // 上昇
    KeyS: false,    // 下降
    Space: false    // 上昇（スペースキー）
};
