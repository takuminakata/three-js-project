import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// シーン、カメラ、レンダラーの初期化
let scene, camera, renderer, controls;
let gltfModel; // GLTFモデル用の変数（マップ）
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
    loadGLTFModel();
    
    // ロボットモデルの読み込み
    loadRobotModel();

    // ウィンドウリサイズイベント
    window.addEventListener('resize', onWindowResize, false);
    
    // キーボードイベントリスナーを追加
    setupKeyboardControls();
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
 * GLTFモデルを読み込む関数
 */
function loadGLTFModel() {
    // GLTFローダーのインスタンスを作成
    const loader = new GLTFLoader();

    // ローディング中の表示（コンソールに出力）
    console.log('GLTFモデルを読み込み中...');

    // モデルを読み込む
    loader.load(
        // モデルのパス
        '/models/luni_sul_mignone_1300ac_rawscan_gltf/scene.gltf',
        
        // 読み込み成功時のコールバック
        function (gltf) {
            gltfModel = gltf.scene;

            // モデルのスケール調整（マップを大きく表示）
            const box = new THREE.Box3().setFromObject(gltfModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 30 / maxDim; // マップを大きく表示
            gltfModel.scale.setScalar(scale);

            // モデルの中心を原点に合わせる
            const center = box.getCenter(new THREE.Vector3());
            gltfModel.position.x = -center.x * scale;
            gltfModel.position.y = -center.y * scale;
            gltfModel.position.z = -center.z * scale;

            // マップを270°（-90°）回転（上下の向きを調整）
            gltfModel.rotation.x = -Math.PI / 2; // -90度回転

            // 回転後のバウンディングボックスを再計算
            const rotatedBox = new THREE.Box3().setFromObject(gltfModel);
            const rotatedSize = rotatedBox.getSize(new THREE.Vector3());
            const rotatedMin = rotatedBox.min;
            
            // マップの底面を床（y = -2）に合わせる
            const floorY = -2;
            gltfModel.position.y = floorY - rotatedMin.y;

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
            gltfModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // シーンに追加
            scene.add(gltfModel);

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
        '/models/cute_robot_gltf/scene.gltf',
        
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
            
            // 浮遊アニメーションを現在の位置に追加（上書きではなく追加）
            robotModel.position.y = robotModel.userData.baseY + floatOffset;
        }
        
        // 現在のY軸移動状態を記録
        wasMovingY = isMovingY;
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

// 初期化とアニメーション開始
init();
animate();

