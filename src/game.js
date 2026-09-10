import * as THREE from 'three';
import { GAME_DURATION, BALL_RADIUS, ROBOT_RADIUS } from './config.js';
import { state } from './state.js';

/**
 * ゲームコントロールの設定
 */
export function setupGameControls() {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
}

/**
 * ゲーム開始
 */
export function startGame() {
    if (state.gameState === 'playing') return;

    // 結果表示中に再スタートされた場合、自動消去タイマーが
    // 新しいゲームの状態を巻き戻してしまわないようキャンセルする
    if (state.resultTimeoutId) {
        clearTimeout(state.resultTimeoutId);
        state.resultTimeoutId = null;
    }

    state.gameState = 'playing';
    state.gameStartTime = Date.now();

    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('game-result').classList.add('hidden');
    updateCountdownUI(GAME_DURATION);

    createTargetBall();
    startCountdown();

    console.log('ゲーム開始！');
}

/**
 * ターゲットボールを作成
 */
function createTargetBall() {
    if (!state.robotModel) return;

    if (state.targetBall) {
        disposeBall(state.targetBall);
        state.scene.remove(state.targetBall);
        state.targetBall = null;
    }

    // ロボットから適度な距離の位置を生成（マップ範囲内）
    const robotPos = state.robotModel.position;
    const minDistance = 5; // ロボットから最低5m離れた位置
    const { mapBounds } = state;

    let ballPosition;
    let attempts = 0;
    const maxAttempts = 20;

    do {
        const x = mapBounds.minX + Math.random() * (mapBounds.maxX - mapBounds.minX);
        const z = mapBounds.minZ + Math.random() * (mapBounds.maxZ - mapBounds.minZ);
        const y = mapBounds.minY + Math.random() * (mapBounds.maxY - mapBounds.minY);

        ballPosition = new THREE.Vector3(x, y, z);
        attempts++;
    } while (
        ballPosition.distanceTo(robotPos) < minDistance &&
        attempts < maxAttempts
    );

    // 最大試行回数に達した場合は、ロボットから最小距離の位置を強制設定
    if (attempts >= maxAttempts) {
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();

        ballPosition = robotPos.clone().add(direction.multiplyScalar(minDistance + 1));

        ballPosition.x = Math.max(mapBounds.minX, Math.min(mapBounds.maxX, ballPosition.x));
        ballPosition.z = Math.max(mapBounds.minZ, Math.min(mapBounds.maxZ, ballPosition.z));
        ballPosition.y = Math.max(mapBounds.minY, Math.min(mapBounds.maxY, ballPosition.y));
    }

    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        shininess: 100
    });

    const targetBall = new THREE.Mesh(ballGeometry, ballMaterial);
    targetBall.position.copy(ballPosition);

    // キラキラエフェクト用のユーザーデータ
    targetBall.userData = {
        originalY: ballPosition.y,
        time: 0,
        sparkles: []
    };

    createSparkleEffect(targetBall);

    state.scene.add(targetBall);
    state.targetBall = targetBall;

    console.log('ボール生成:', ballPosition);
}

/**
 * キラキラエフェクトを作成
 */
function createSparkleEffect(ball) {
    const sparkleCount = 20;
    const sparkleGeometry = new THREE.SphereGeometry(0.05, 8, 8);

    for (let i = 0; i < sparkleCount; i++) {
        const sparkleMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1, 0.8),
            transparent: true,
            opacity: 0.8
        });

        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        sparkle.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );

        sparkle.userData = {
            originalPosition: sparkle.position.clone(),
            speed: Math.random() * 0.02 + 0.01
        };

        ball.userData.sparkles.push(sparkle);
        ball.add(sparkle);
    }
}

/**
 * カウントダウン開始
 */
function startCountdown() {
    // より細かい間隔で更新（50msごと）
    state.countdownInterval = setInterval(() => {
        const elapsed = (Date.now() - state.gameStartTime) / 1000;
        const remaining = Math.max(0, GAME_DURATION - elapsed);

        if (remaining <= 0) {
            endGame('failed');
            return;
        }

        updateCountdownUI(remaining);
    }, 50);
}

/**
 * カウントダウンUI更新
 */
function updateCountdownUI(remainingTime = null) {
    const timeDisplay = document.getElementById('time-display');
    const progressBar = document.getElementById('countdown-progress');

    const displayTime = remainingTime !== null ? remainingTime : GAME_DURATION;

    if (timeDisplay) {
        timeDisplay.textContent = Math.ceil(displayTime);
    }

    if (progressBar) {
        const progress = (displayTime / GAME_DURATION) * 100;
        progressBar.style.width = `${progress}%`;

        // 色を時間に応じて変更（滑らかな色変化）
        if (displayTime <= 3) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (displayTime <= 6) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
        }
    }
}

/**
 * ゲーム終了
 */
function endGame(result) {
    if (state.gameState !== 'playing') return;

    state.gameState = result;

    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }

    if (state.targetBall) {
        disposeBall(state.targetBall);
        state.scene.remove(state.targetBall);
        state.targetBall = null;
    }

    const gameResult = document.getElementById('game-result');
    const resultMessage = document.querySelector('.result-message');

    gameResult.classList.remove('hidden');
    resultMessage.classList.remove('clear', 'failed');
    resultMessage.classList.add(result);
    resultMessage.textContent = result === 'clear' ? 'CLEAR!' : 'FAILED...';

    // 3秒後に結果とカウントダウンタイマーを自動消去
    state.resultTimeoutId = setTimeout(() => {
        gameResult.classList.add('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        state.gameState = 'idle';
        state.resultTimeoutId = null;
    }, 3000);

    console.log('ゲーム終了:', result);
}

/**
 * ボールのエフェクト更新
 */
export function updateBallEffects() {
    const { targetBall } = state;
    if (!targetBall || !targetBall.userData) return;

    const time = Date.now() * 0.001;
    targetBall.userData.time = time;

    // ボールの上下浮遊
    const floatAmplitude = 0.3;
    const floatSpeed = 2.0;
    targetBall.position.y = targetBall.userData.originalY + Math.sin(time * floatSpeed) * floatAmplitude;

    // ボールの回転
    targetBall.rotation.x += 0.01;
    targetBall.rotation.y += 0.015;

    // キラキラパーティクルの更新
    targetBall.userData.sparkles.forEach((sparkle, index) => {
        sparkle.position.copy(sparkle.userData.originalPosition);

        // 円形に回転
        const angle = time * sparkle.userData.speed + index * 0.5;
        sparkle.position.x += Math.cos(angle) * 2;
        sparkle.position.z += Math.sin(angle) * 2;
        sparkle.position.y += Math.sin(time * 3 + index) * 0.5;

        // 透明度の変化
        sparkle.material.opacity = 0.5 + Math.sin(time * 4 + index) * 0.3;

        // 色の変化
        const hue = (time * 0.1 + index * 0.1) % 1;
        sparkle.material.color.setHSL(hue, 1, 0.8);
    });
}

/**
 * ボールのジオメトリ・マテリアルを破棄してメモリを解放
 */
function disposeBall(ball) {
    if (!ball) return;
    if (ball.userData.sparkles) {
        ball.userData.sparkles.forEach((sparkle) => {
            sparkle.geometry.dispose();
            sparkle.material.dispose();
        });
    }
    ball.geometry.dispose();
    ball.material.dispose();
}

/**
 * 接触判定
 */
export function checkCollision() {
    const { robotModel, targetBall } = state;
    if (!robotModel || !targetBall) return;

    const distance = robotModel.position.distanceTo(targetBall.position);
    const collisionDistance = ROBOT_RADIUS + BALL_RADIUS;

    if (distance < collisionDistance) {
        endGame('clear');
    }
}
