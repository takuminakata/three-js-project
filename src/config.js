// 床のY座標（マップ・ロボットの基準高さ）
export const FLOOR_Y = -2;

// カメラの高さ制限
export const MIN_CAMERA_HEIGHT = 3.0;
export const LOG_INTERVAL = 1000; // カメラ位置ログの間隔（ms）

// ロボット移動・回転
export const ROBOT_SPEED = 0.15;
export const MOVEMENT_LERP_FACTOR = 0.1; // 移動の補間係数（0.1 = 10%ずつ近づく）
export const ROTATION_LERP_FACTOR = 0.08; // 回転の補間係数
export const MIN_ROBOT_HEIGHT = 0.5; // 床からの最低高さ
export const MAX_ROBOT_HEIGHT = 15.0; // 床からの最高高さ
export const MAX_GROUND_RISE_PER_FRAME = 0.3; // 地面検出の上昇量の上限（壁際などの誤検出による瞬間的な浮き上がりを防ぐ）

// ゲーム設定
export const GAME_DURATION = 10; // ゲームの制限時間（秒）
export const BALL_RADIUS = 1.0;
export const ROBOT_RADIUS = 1.5; // ロボットの当たり判定半径

// デバッグ表示
export const DEBUG_AXES_SIZE = 20; // XYZ軸ヘルパーの長さ
export const DEBUG_BVH_DEPTH = 4; // BVH可視化の階層深さ（大きいほど重くなる）

// マップの境界情報の初期値（モデル読み込み後に再計算される）
export const INITIAL_MAP_BOUNDS = {
    minX: -15,
    maxX: 15,
    minZ: -15,
    maxZ: 15,
    minY: -2,
    maxY: 8
};
