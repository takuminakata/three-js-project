const loadingScreen = document.getElementById('loading-screen');

const done = { map: false, robot: false };

/**
 * モデルの読み込み完了（成功・失敗どちらも）を通知する
 * すべてのモデルが完了したらローディング画面を隠す
 */
export function markModelLoaded(key) {
    done[key] = true;

    if (done.map && done.robot && loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}
