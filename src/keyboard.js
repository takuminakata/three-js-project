import { keys } from './state.js';

/**
 * キーボードコントロールの設定
 */
export function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
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

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
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
