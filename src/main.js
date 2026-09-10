import { state } from './state.js';
import { MIN_CAMERA_HEIGHT, LOG_INTERVAL } from './config.js';
import {
    createScene,
    createCamera,
    createRenderer,
    createControls,
    addLights,
    onWindowResize
} from './scene.js';
import { loadMapModel, loadRobotModel } from './loaders.js';
import { setupKeyboardControls } from './keyboard.js';
import { updateRobotMovement, updateRobotFloat } from './robot.js';
import { setupGameControls, updateBallEffects, checkCollision } from './game.js';
import { setupDebugControls, updateDebugPanel } from './debug.js';

/**
 * 初期設定を行う関数
 */
function init() {
    state.scene = createScene();
    state.camera = createCamera();
    state.renderer = createRenderer();
    state.controls = createControls(state.camera, state.renderer);

    addLights(state.scene);

    loadMapModel();
    loadRobotModel();

    window.addEventListener('resize', onWindowResize, false);

    setupKeyboardControls();
    setupGameControls();
    setupDebugControls();
}

/**
 * アニメーションループ
 */
function animate() {
    requestAnimationFrame(animate);

    // カメラの高さ制限（Y座標が下限を下回らないようにする）
    if (state.camera.position.y < MIN_CAMERA_HEIGHT) {
        state.camera.position.y = MIN_CAMERA_HEIGHT;
    }

    updateRobotMovement();
    updateRobotFloat();

    if (state.gameState === 'playing') {
        updateBallEffects();
        checkCollision();
    }

    const currentTime = Date.now();
    if (currentTime - state.lastLogTime >= LOG_INTERVAL) {
        state.lastLogTime = currentTime;
    }

    updateDebugPanel();

    state.controls.update();
    state.renderer.render(state.scene, state.camera);
}

init();
animate();
