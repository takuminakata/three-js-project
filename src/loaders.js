import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FLOOR_Y } from './config.js';
import { state } from './state.js';
import { markModelLoaded } from './loading.js';
import { buildMapCollider } from './collision.js';

/**
 * マップモデルを読み込む
 */
export function loadMapModel() {
    const loader = new GLTFLoader();
    console.log('GLTFモデルを読み込み中...');

    loader.load(
        './models/luni_sul_mignone_1300ac_rawscan_gltf/scene.gltf',
        (gltf) => {
            const mapModel = gltf.scene;
            state.mapModel = mapModel;

            // モデルのスケール調整（マップを大きく表示）
            const box = new THREE.Box3().setFromObject(mapModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 30 / maxDim;
            mapModel.scale.setScalar(scale);

            // モデルの中心を原点に合わせる
            const center = box.getCenter(new THREE.Vector3());
            mapModel.position.x = -center.x * scale;
            mapModel.position.y = -center.y * scale;
            mapModel.position.z = -center.z * scale;

            // マップを270°（-90°）回転（上下の向きを調整）
            mapModel.rotation.x = -Math.PI / 2;

            // 回転後のバウンディングボックスを再計算し、底面を床に合わせる
            const rotatedBox = new THREE.Box3().setFromObject(mapModel);
            mapModel.position.y = FLOOR_Y - rotatedBox.min.y;

            // カメラをマップの中心に向けて配置
            state.camera.position.set(-0.31, 6.99, 19.71);
            state.camera.lookAt(0, 0, 0);
            state.controls.target.set(0, 0, 0);
            state.controls.update();

            // 影の設定
            mapModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            state.scene.add(mapModel);

            calculateMapBounds();
            buildMapCollider(mapModel);

            markModelLoaded('map');
            console.log('GLTFモデルの読み込み完了！');
        },
        (xhr) => {
            if (!xhr.lengthComputable) return;
            const percent = (xhr.loaded / xhr.total) * 100;
            console.log(`読み込み中: ${percent.toFixed(2)}%`);
        },
        (error) => {
            markModelLoaded('map');
            console.error('GLTFモデルの読み込みエラー:', error);
        }
    );
}

/**
 * ロボットモデルを読み込む
 */
export function loadRobotModel() {
    const loader = new GLTFLoader();
    console.log('ロボットモデルを読み込み中...');

    loader.load(
        './models/cute_robot_gltf/scene.gltf',
        (gltf) => {
            const robotModel = gltf.scene;
            state.robotModel = robotModel;

            // ロボットを適切なサイズに調整（高さ2m程度に）
            const box = new THREE.Box3().setFromObject(robotModel);
            const size = box.getSize(new THREE.Vector3());
            const targetHeight = 2.0;
            const scale = targetHeight / size.y;
            robotModel.scale.setScalar(scale);

            // スケール後のバウンディングボックスを再計算
            const scaledBox = new THREE.Box3().setFromObject(robotModel);
            const scaledMin = scaledBox.min;

            // 床から少し浮かせた位置に配置（Y座標が負にならないように）
            const floatHeight = 3.0;
            robotModel.position.set(
                -0.3,
                FLOOR_Y - scaledMin.y + floatHeight,
                7.5
            );

            // アニメーション用に初期Y座標を保存
            robotModel.userData.baseY = FLOOR_Y - scaledMin.y + floatHeight;

            // 滑らかな移動のための目標位置を初期化
            state.robotTargetPosition.copy(robotModel.position);
            state.robotTargetRotation = robotModel.rotation.y;

            // 影の設定
            robotModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            state.scene.add(robotModel);

            markModelLoaded('robot');
            console.log('ロボットモデルの読み込み完了！');
        },
        (xhr) => {
            if (!xhr.lengthComputable) return;
            const percent = (xhr.loaded / xhr.total) * 100;
            console.log(`ロボット読み込み中: ${percent.toFixed(2)}%`);
        },
        (error) => {
            markModelLoaded('robot');
            console.error('ロボットモデルの読み込みエラー:', error);
        }
    );
}

/**
 * マップの境界を計算
 */
function calculateMapBounds() {
    if (!state.mapModel) return;

    const boundingBox = new THREE.Box3().setFromObject(state.mapModel);

    // 境界を設定（少し余裕を持たせる）
    const margin = 2;
    state.mapBounds.minX = boundingBox.min.x + margin;
    state.mapBounds.maxX = boundingBox.max.x - margin;
    state.mapBounds.minZ = boundingBox.min.z + margin;
    state.mapBounds.maxZ = boundingBox.max.z - margin;
    state.mapBounds.minY = boundingBox.min.y + margin;
    state.mapBounds.maxY = boundingBox.max.y + 3; // マップの上に少し余裕

    console.log('マップ境界:', state.mapBounds);
}
