import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// シーン、カメラ、レンダラーの初期化
let scene, camera, renderer, controls;
let mapModel; // GLTFモデル用の変数（マップ）
let robotModel; // ロボットモデル用の変数

// カメラ位置の表示用
let lastLogTime = 0;
let logInterval = 1000; // 1秒ごとに表示

// カメラの高さ制限
const minCameraHeight = 3.0; // 最低高さ

// ロボット移動用の変数
let robotVelocity = new THREE.Vector3(); // ロボットの移動速度
const robotSpeed = 0.15; // ロボットの移動速度（フレームごと）
const robotRotationSpeed = 0.05; // ロボットの回転速度

// Y軸移動の状態管理
let wasMovingY = false; // 前フレームでY軸移動していたかどうか
let lastYKeys = { W: false, S: false }; // 前フレームのY軸キーの状態

// ゲーム関連の変数
let gameState = 'idle'; // 'idle', 'playing', 'clear', 'failed'
let targetBall = null; // ターゲットボール
let gameTimer = null; // ゲームタイマー
let countdownInterval = null; // カウントダウン用のインターバル
let gameTimeLeft = 10; // 残り時間（秒）
let gameStartTime = 0; // ゲーム開始時刻
let ballRadius = 1.0; // ボールの半径
let robotRadius = 1.5; // ロボットの当たり判定半径

// マップの境界情報
let mapBounds = {
    minX: -15,
    maxX: 15,
    minZ: -15,
    maxZ: 15,
    minY: -2,
    maxY: 8
};

// 滑らかな移動と回転のための変数
let robotTargetPosition = new THREE.Vector3(); // 目標位置
let robotTargetRotation = 0; // 目標回転角度
const movementLerpFactor = 0.1; // 移動の補間係数（0.1 = 10%ずつ近づく）
const rotationLerpFactor = 0.08; // 回転の補間係数

// Y軸移動の制限
const minRobotHeight = 0.5; // ロボットの最低高さ（床から0.5m）
const maxRobotHeight = 15.0; // ロボットの最高高さ（床から15m）

// キーボード入力の状態管理
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,    // 上昇
    KeyS: false,    // 下降
    Space: false    // 上昇（スペースキー）
};

/**
 * 初期設定を行う関数
 */
function init() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // カメラの作成（視野角、アスペクト比、near、far）
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // DOMにCanvasを追加
    const container = document.getElementById('canvas-container');
    container.appendChild(renderer.domElement);

    // OrbitControlsの追加（マウスでカメラを操作可能に）
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false; // カメラの自動回転を無効化
    controls.autoRotateSpeed = 1.0;

    // ライトの追加
    addLights();

    // GLTFモデルの読み込み
    loadmapModel();
    
    // ロボットモデルの読み込み
    loadRobotModel();

    // ウィンドウリサイズイベント
    window.addEventListener('resize', onWindowResize, false);
    
    // キーボードイベントリスナーを追加
    setupKeyboardControls();
    
    // ゲームイベントリスナーを追加
    setupGameControls();
}

/**
 * ライトを追加する関数
 */
function addLights() {
    // 環境光（全体を柔らかく照らす）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // ディレクショナルライト（太陽のような光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // ポイントライト（点光源）
    const pointLight = new THREE.PointLight(0xff6b6b, 1, 100);
    pointLight.position.set(-3, 3, 2);
    scene.add(pointLight);

    // もう一つのポイントライト（カラフルに）
    const pointLight2 = new THREE.PointLight(0x4ecdc4, 1, 100);
    pointLight2.position.set(3, -3, 2);
    scene.add(pointLight2);
}

/**
 * mapモデルを読み込む関数
 */
function loadmapModel() {
    // GLTFローダーのインスタンスを作成
    const loader = new GLTFLoader();

    // ローディング中の表示（コンソールに出力）
    console.log('GLTFモデルを読み込み中...');

    // モデルを読み込む
    loader.load(
        // モデルのパス
        './models/luni_sul_mignone_1300ac_rawscan_gltf/scene.gltf',
        
        // 読み込み成功時のコールバック
        function (gltf) {
            mapModel = gltf.scene;

            // モデルのスケール調整（マップを大きく表示）
            const box = new THREE.Box3().setFromObject(mapModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 30 / maxDim; // マップを大きく表示
            mapModel.scale.setScalar(scale);

            // モデルの中心を原点に合わせる
            const center = box.getCenter(new THREE.Vector3());
            mapModel.position.x = -center.x * scale;
            mapModel.position.y = -center.y * scale;
            mapModel.position.z = -center.z * scale;

            // マップを270°（-90°）回転（上下の向きを調整）
            mapModel.rotation.x = -Math.PI / 2; // -90度回転

            // 回転後のバウンディングボックスを再計算
            const rotatedBox = new THREE.Box3().setFromObject(mapModel);
            const rotatedSize = rotatedBox.getSize(new THREE.Vector3());
            const rotatedMin = rotatedBox.min;
            
            // マップの底面を床（y = -2）に合わせる
            const floorY = -2;
            mapModel.position.y = floorY - rotatedMin.y;

            // カメラを指定位置に配置
            camera.position.set(
                -0.31, // X軸
                6.99,  // Y軸
                19.71  // Z軸
            );
            
            // カメラをマップの中心に向ける
            camera.lookAt(0, 0, 0);
            
            // OrbitControlsのターゲットをマップの中心に設定
            controls.target.set(0, 0, 0);
            controls.update();

            // 影の設定
            mapModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // シーンに追加
            scene.add(mapModel);

            // マップの境界を計算
            calculateMapBounds();

            console.log('GLTFモデルの読み込み完了！');
        },
        
        // 読み込み進捗のコールバック
        function (xhr) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
            console.log(`読み込み中: ${percent}%`);
        },
        
        // エラー時のコールバック
        function (error) {
            console.error('GLTFモデルの読み込みエラー:', error);
        }
    );
}

/**
 * ロボットモデルを読み込む関数
 */
function loadRobotModel() {
    // GLTFローダーのインスタンスを作成
    const loader = new GLTFLoader();

    // ローディング中の表示（コンソールに出力）
    console.log('ロボットモデルを読み込み中...');

    // モデルを読み込む
    loader.load(
        // ロボットモデルのパス
        './models/cute_robot_gltf/scene.gltf',
        
        // 読み込み成功時のコールバック
        function (gltf) {
            robotModel = gltf.scene;

            // ロボットのサイズを計算
            const box = new THREE.Box3().setFromObject(robotModel);
            const size = box.getSize(new THREE.Vector3());
            const min = box.min;

            // ロボットを適切なサイズに調整（高さ2m程度に）
            const targetHeight = 2.0;
            const scale = targetHeight / size.y;
            robotModel.scale.setScalar(scale);

            // ロボットをマップの中心、床の上に配置
            const floorY = -2;
            
            // スケール後のバウンディングボックスを再計算
            const scaledBox = new THREE.Box3().setFromObject(robotModel);
            const scaledMin = scaledBox.min;
            
            // ロボットを床から少し浮かせた位置に配置
            const floatHeight = 3.0; // 床から3.0m浮かせる（Y座標が負にならないように）
            robotModel.position.set(
                -0.3, // X軸
                floorY - scaledMin.y + floatHeight, // Y軸: 床から少し浮かせる
                7.5  // Z軸
            );
            
            // アニメーション用に初期Y座標を保存
            robotModel.userData.baseY = floorY - scaledMin.y + floatHeight;
            
            // 滑らかな移動のための目標位置を初期化
            robotTargetPosition.copy(robotModel.position);
            robotTargetRotation = robotModel.rotation.y;

            // 影の設定
            robotModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // シーンに追加
            scene.add(robotModel);

            console.log('ロボットモデルの読み込み完了！');
        },
        
        // 読み込み進捗のコールバック
        function (xhr) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
            console.log(`ロボット読み込み中: ${percent}%`);
        },
        
        // エラー時のコールバック
        function (error) {
            console.error('ロボットモデルの読み込みエラー:', error);
        }
    );
}

/**
 * ゲームコントロールの設定
 */
function setupGameControls() {
    // スタートボタンのイベントリスナー
    const startBtn = document.getElementById('start-game-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
}

/**
 * ゲーム開始
 */
function startGame() {
    if (gameState === 'playing') return;
    
    gameState = 'playing';
    gameTimeLeft = 10;
    gameStartTime = Date.now(); // ゲーム開始時刻を記録
    
    // UI更新
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('game-result').classList.add('hidden');
    updateCountdownUI();
    
    // ランダムな位置にボールを生成
    createTargetBall();
    
    // カウントダウン開始
    startCountdown();
    
    console.log('ゲーム開始！');
}


/**
 * マップの境界を計算
 */
function calculateMapBounds() {
    if (!mapModel) return;
    
    // マップ全体のバウンディングボックスを計算
    const boundingBox = new THREE.Box3().setFromObject(mapModel);
    
    // 境界を設定（少し余裕を持たせる）
    const margin = 2;
    mapBounds.minX = boundingBox.min.x + margin;
    mapBounds.maxX = boundingBox.max.x - margin;
    mapBounds.minZ = boundingBox.min.z + margin;
    mapBounds.maxZ = boundingBox.max.z - margin;
    mapBounds.minY = boundingBox.min.y + margin;
    mapBounds.maxY = boundingBox.max.y + 3; // マップの上に少し余裕
    
    console.log('マップ境界:', mapBounds);
}

/**
 * ターゲットボールを作成
 */
function createTargetBall() {
    // 既存のボールを削除
    if (targetBall) {
        scene.remove(targetBall);
    }
    
    // ロボットから適度な距離の位置を生成（マップ範囲内）
    const robotPos = robotModel.position;
    const minDistance = 5; // ロボットから最低5m離れた位置
    const maxDistance = 12; // 最大12m離れた位置
    
    let ballPosition;
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
        // マップ範囲内でランダムな位置を生成
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
        
        // マップ範囲内に収める
        ballPosition.x = Math.max(mapBounds.minX, Math.min(mapBounds.maxX, ballPosition.x));
        ballPosition.z = Math.max(mapBounds.minZ, Math.min(mapBounds.maxZ, ballPosition.z));
        ballPosition.y = Math.max(mapBounds.minY, Math.min(mapBounds.maxY, ballPosition.y));
    }
    
    // ボールのジオメトリとマテリアルを作成
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        shininess: 100
    });
    
    targetBall = new THREE.Mesh(ballGeometry, ballMaterial);
    targetBall.position.copy(ballPosition);
    
    // キラキラエフェクト用のユーザーデータ
    targetBall.userData = {
        originalY: ballPosition.y,
        time: 0,
        sparkles: []
    };
    
    // パーティクルエフェクトを追加
    createSparkleEffect(targetBall);
    
    scene.add(targetBall);
    
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
    updateCountdownUI();
    
    // より細かい間隔で更新（50msごと）
    countdownInterval = setInterval(() => {
        const elapsed = (Date.now() - gameStartTime) / 1000; // 経過時間（秒）
        const remaining = Math.max(0, 10 - elapsed); // 残り時間
        
        // 残り時間が0以下になったらゲーム終了
        if (remaining <= 0) {
            endGame('failed');
            return;
        }
        
        // UI更新（滑らかな更新）
        updateCountdownUI(remaining);
    }, 50); // 50msごとに更新
}

/**
 * カウントダウンUI更新
 */
function updateCountdownUI(remainingTime = null) {
    const timeDisplay = document.getElementById('time-display');
    const progressBar = document.getElementById('countdown-progress');
    
    // 引数が渡されていない場合は現在の残り時間を使用
    const displayTime = remainingTime !== null ? remainingTime : gameTimeLeft;
    
    if (timeDisplay) {
        // 整数秒で表示（例: 8秒）
        timeDisplay.textContent = Math.ceil(displayTime);
    }
    
    if (progressBar) {
        const progress = (displayTime / 10) * 100;
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
    if (gameState !== 'playing') return;
    
    gameState = result;
    
    // タイマーをクリア
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // ボールを削除
    if (targetBall) {
        scene.remove(targetBall);
        targetBall = null;
    }
    
    // 結果表示
    const gameResult = document.getElementById('game-result');
    const resultMessage = document.querySelector('.result-message');
    
    gameResult.classList.remove('hidden');
    resultMessage.classList.remove('clear', 'failed');
    resultMessage.classList.add(result);
    
    if (result === 'clear') {
        resultMessage.textContent = 'CLEAR!';
    } else {
        resultMessage.textContent = 'FAILED...';
    }
    
    // 3秒後に結果とカウントダウンタイマーを自動消去
    setTimeout(() => {
        gameResult.classList.add('hidden');
        // カウントダウンタイマーも非表示にする
        document.getElementById('game-ui').classList.add('hidden');
        // ゲーム状態をリセットして新しいゲームを開始可能にする
        gameState = 'idle';
    }, 3000);
    
    console.log('ゲーム終了:', result);
}

/**
 * キーボードコントロールの設定
 */
function setupKeyboardControls() {
    // キーが押された時の処理
    document.addEventListener('keydown', (event) => {
        switch(event.code) {
            case 'ArrowUp':
                keys.ArrowUp = true;
                break;
            case 'ArrowDown':
                keys.ArrowDown = true;
                break;
            case 'ArrowLeft':
                keys.ArrowLeft = true;
                break;
            case 'ArrowRight':
                keys.ArrowRight = true;
                break;
            case 'KeyW':
                keys.KeyW = true;
                break;
            case 'KeyS':
                keys.KeyS = true;
                break;
            case 'Space':
                event.preventDefault(); // ページのスクロールを防ぐ
                keys.Space = true;
                break;
        }
    });

    // キーが離された時の処理
    document.addEventListener('keyup', (event) => {
        switch(event.code) {
            case 'ArrowUp':
                keys.ArrowUp = false;
                break;
            case 'ArrowDown':
                keys.ArrowDown = false;
                break;
            case 'ArrowLeft':
                keys.ArrowLeft = false;
                break;
            case 'ArrowRight':
                keys.ArrowRight = false;
                break;
            case 'KeyW':
                keys.KeyW = false;
                break;
            case 'KeyS':
                keys.KeyS = false;
                break;
            case 'Space':
                keys.Space = false;
                break;
        }
    });
}

/**
 * ロボットの移動処理（滑らかな移動と回転）
 */
function updateRobotMovement() {
    if (!robotModel) return;

    // 移動速度をリセット
    robotVelocity.set(0, 0, 0);

    // 水平移動（X, Z軸）を処理
    if (keys.ArrowUp) {
        robotVelocity.z -= robotSpeed; // 前進（Z軸負方向）
    }
    if (keys.ArrowDown) {
        robotVelocity.z += robotSpeed; // 後退（Z軸正方向）
    }
    if (keys.ArrowLeft) {
        robotVelocity.x -= robotSpeed; // 左移動（X軸負方向）
    }
    if (keys.ArrowRight) {
        robotVelocity.x += robotSpeed; // 右移動（X軸正方向）
    }
    
    // 水平移動がある場合のみ回転を更新
    const horizontalVelocity = new THREE.Vector3(robotVelocity.x, 0, robotVelocity.z);
    if (horizontalVelocity.length() > 0) {
        robotTargetRotation = Math.atan2(horizontalVelocity.x, horizontalVelocity.z);
    }
    
    // Y軸移動の処理を分離（キーの状態変化を検出）
    const currentW = keys.KeyW || keys.Space;
    const currentS = keys.KeyS;
    
    // Y軸移動を処理
    if (currentW && !currentS) {
        robotVelocity.y += robotSpeed; // 上昇（Y軸正方向）
    } else if (currentS && !currentW) {
        robotVelocity.y -= robotSpeed; // 下降（Y軸負方向）
    }
    // 両方押されている場合は停止（何もしない）
    
    // 現在のキー状態を保存
    lastYKeys.W = currentW;
    lastYKeys.S = currentS;

    // ロボットの移動処理
    if (robotVelocity.length() > 0) {
        // 目標位置を更新（現在位置 + 移動ベクトル）
        robotTargetPosition.add(robotVelocity);
    }

    // Y軸移動の制限を適用
    const floorY = -2; // 床のY座標
    const minY = floorY + minRobotHeight; // 最低Y座標
    const maxY = floorY + maxRobotHeight; // 最高Y座標
    
    if (robotTargetPosition.y < minY) {
        robotTargetPosition.y = minY;
    }
    if (robotTargetPosition.y > maxY) {
        robotTargetPosition.y = maxY;
    }

    // 滑らかな移動：現在位置から目標位置へ補間
    robotModel.position.lerp(robotTargetPosition, movementLerpFactor);
    
    // 滑らかな回転：現在の回転から目標回転へ補間
    const currentRotation = robotModel.rotation.y;
    const rotationDiff = robotTargetRotation - currentRotation;
    
    // 回転の差がπを超える場合の調整（最短経路で回転）
    let adjustedRotationDiff = rotationDiff;
    if (rotationDiff > Math.PI) {
        adjustedRotationDiff -= 2 * Math.PI;
    } else if (rotationDiff < -Math.PI) {
        adjustedRotationDiff += 2 * Math.PI;
    }
    
    // 回転を補間
    robotModel.rotation.y += adjustedRotationDiff * rotationLerpFactor;
}

/**
 * アニメーションループ
 */
function animate() {
    requestAnimationFrame(animate);

    // カメラの高さ制限（Y座標が3.0以下にならないようにする）
    if (camera.position.y < minCameraHeight) {
        camera.position.y = minCameraHeight;
    }

    // ロボットの移動処理
    updateRobotMovement();

    // 浮遊アニメーションの処理（Y軸移動中は完全に無効化）
    if (robotModel && robotModel.userData.baseY !== undefined) {
        const isMovingY = Math.abs(robotVelocity.y) > 0;
        
        // Y軸移動が停止した瞬間に基準位置を更新
        if (wasMovingY && !isMovingY) {
            robotModel.userData.baseY = robotModel.position.y;
        }
        
        // Y軸移動していない場合のみ浮遊アニメーションを適用
        if (!isMovingY) {
            const floatAmplitude = robotVelocity.length() > 0 ? 0.1 : 0.2;
            const floatSpeed = 0.001;
            const floatOffset = Math.sin(Date.now() * floatSpeed) * floatAmplitude;
            
            // 浮遊アニメーションを現在の位置に追加
            robotModel.position.y = robotModel.userData.baseY + floatOffset;
        }
        
        // 現在のY軸移動状態を記録
        wasMovingY = isMovingY;
    }

    // ゲーム中の処理
    if (gameState === 'playing') {
        // ボールのキラキラエフェクト更新
        updateBallEffects();
        
        // 接触判定
        checkCollision();
    }

    // カメラ位置を定期的にコンソールに表示
    const currentTime = Date.now();
    if (currentTime - lastLogTime >= logInterval) {
        // console.log('カメラ位置:', {
        //     x: camera.position.x.toFixed(2),
        //     y: camera.position.y.toFixed(2),
        //     z: camera.position.z.toFixed(2)
        // });
        lastLogTime = currentTime;
    }

    // OrbitControlsの更新
    controls.update();

    // シーンをレンダリング
    renderer.render(scene, camera);
}

/**
 * ウィンドウリサイズ時の処理
 */
function onWindowResize() {
    // カメラのアスペクト比を更新
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // レンダラーのサイズを更新
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * ボールのエフェクト更新
 */
function updateBallEffects() {
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
 * 接触判定
 */
function checkCollision() {
    if (!robotModel || !targetBall) return;
    
    const distance = robotModel.position.distanceTo(targetBall.position);
    const collisionDistance = robotRadius + ballRadius;
    
    if (distance < collisionDistance) {
        endGame('clear');
    }
}

// 初期化とアニメーション開始
init();
animate();

