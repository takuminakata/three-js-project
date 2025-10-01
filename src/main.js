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
 * アニメーションループ
 */
function animate() {
    requestAnimationFrame(animate);

    // カメラの高さ制限（Y座標が3.0以下にならないようにする）
    if (camera.position.y < minCameraHeight) {
        camera.position.y = minCameraHeight;
    }

    // ロボットを上下にプカプカ動かす
    if (robotModel && robotModel.userData.baseY !== undefined) {
        const floatAmplitude = 0.3; // 浮遊の振幅（上下に0.3m）
        const floatSpeed = 0.001; // 浮遊の速さ
        robotModel.position.y = robotModel.userData.baseY + Math.sin(Date.now() * floatSpeed) * floatAmplitude;
    }

    // カメラ位置を定期的にコンソールに表示
    const currentTime = Date.now();
    if (currentTime - lastLogTime >= logInterval) {
        console.log('カメラ位置:', {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2)
        });
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

