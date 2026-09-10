import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { state } from './state.js';

/**
 * シーンを作成
 */
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    return scene;
}

/**
 * カメラを作成（視野角、アスペクト比、near、far）
 */
export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    return camera;
}

/**
 * レンダラーを作成し、Canvasをdomに追加
 */
export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById('canvas-container');
    container.appendChild(renderer.domElement);

    return renderer;
}

/**
 * OrbitControlsを作成（マウスでカメラを操作可能に）
 */
export function createControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.0;
    return controls;
}

/**
 * ライトを追加
 */
export function addLights(scene) {
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
}

/**
 * ウィンドウリサイズ時の処理
 */
export function onWindowResize() {
    const { camera, renderer, controls } = state;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.update();
}
