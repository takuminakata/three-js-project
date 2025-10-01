# 🎨 Three.js 簡単なプロジェクト

Three.jsを使った3D Webアプリケーションの初心者向けサンプルプロジェクトです。

## 📖 Three.jsとは？

**Three.js**は、ブラウザ上で3Dグラフィックスを簡単に表示できるJavaScriptライブラリです。

- WebGLという技術を使って、ゲームのような3D映像をWebページに表示できます
- 難しいWebGLのコードを書かなくても、簡単に3Dオブジェクトを作れます
- ゲーム、3Dビジュアライゼーション、VR/AR体験などに使われています

### このプロジェクトで学べること

✅ 3Dオブジェクト（立方体、球体、トーラス）の作成  
✅ ライティング（光の当て方）  
✅ アニメーション（オブジェクトを動かす）  
✅ マウス操作でカメラを動かす方法  
✅ シャドウ（影）の表現

## 🎬 デモの内容

このプロジェクトでは、以下の3つの3Dオブジェクトが表示されます：

1. **緑色の立方体** - くるくる回転します
2. **赤色の球体** - 上下にふわふわ動きながら回転します
3. **青色のトーラス（ドーナツ形）** - 2方向に回転します

すべてのオブジェクトは自動的にアニメーションし、マウスで視点を自由に動かせます。

## 🚀 セットアップ手順（初心者向け）

### 事前準備

このプロジェクトを動かすには、**Node.js**が必要です。

1. [Node.js公式サイト](https://nodejs.org/)から最新版をダウンロード
2. インストーラーを実行してインストール
3. ターミナル（Macの場合）またはコマンドプロンプト（Windowsの場合）を開く

### ステップ1: プロジェクトフォルダに移動

```bash
cd /Users/takumi.nakata/dev/three
```

### ステップ2: 必要なライブラリをインストール

```bash
npm install
```

このコマンドで、Three.jsとVite（開発サーバー）が自動的にインストールされます。  
初回は少し時間がかかることがあります（1〜2分程度）。

### ステップ3: 開発サーバーを起動

```bash
npm run dev
```

成功すると、以下のようなメッセージが表示されます：

```
  VITE v5.4.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### ステップ4: ブラウザで開く

上記の `http://localhost:5173/` をブラウザで開いてください。  
3Dシーンが表示されたら成功です！🎉

## 🎮 操作方法

| 操作 | 効果 |
|------|------|
| **左クリック + ドラッグ** | カメラを回転（視点を変える） |
| **マウスホイール** | ズームイン/アウト（近づく/遠ざかる） |
| **右クリック + ドラッグ** | カメラのパン移動（上下左右に移動） |

## 📁 プロジェクトの構造

```
three/
├── index.html          # HTMLファイル（ページの骨組み）
├── style/
│   └── style.css      # スタイルシート（デザイン・レイアウト）
├── src/
│   └── main.js        # メインのJavaScriptコード（3Dシーンの作成）
├── package.json       # プロジェクトの設定ファイル
├── README.md          # このファイル
└── .gitignore        # Gitで管理しないファイルのリスト
```

### 各ファイルの役割

#### `index.html`
- Webページの構造を定義
- HTMLの基本的な要素（情報パネル、Canvasコンテナ）を配置
- `style.css`と`main.js`を読み込む

#### `style/style.css`
- ページのデザインとレイアウトを定義
- 背景のグラデーション、情報パネルのスタイル、フォント設定など
- HTMLから独立したスタイルシート

#### `src/main.js`
- Three.jsのメインコード
- 3Dオブジェクトの作成、ライト、カメラ、アニメーションを管理
- このファイルがプロジェクトの核心部分

#### `package.json`
- プロジェクトで使うライブラリ（Three.jsなど）の情報
- npm scriptsの定義（`npm run dev`など）
- プロジェクトのメタデータ（名前、バージョンなど）

## 🔍 コードの解説（main.js）

### 1. 基本の3要素

Three.jsでは、必ず以下の3つが必要です：

```javascript
// ① シーン（3D空間全体）
scene = new THREE.Scene();

// ② カメラ（どこから見るか）
camera = new THREE.PerspectiveCamera(視野角, アスペクト比, 最近距離, 最遠距離);

// ③ レンダラー（画面に描画する）
renderer = new THREE.WebGLRenderer();
```

### 2. 3Dオブジェクトの作り方

3Dオブジェクトは「**ジオメトリ**（形）」と「**マテリアル**（質感・色）」を組み合わせて作ります：

```javascript
// 形を作る（例：立方体）
const geometry = new THREE.BoxGeometry(幅, 高さ, 奥行き);

// 質感を作る（例：金属っぽい緑色）
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00ff88,  // 色（16進数）
    metalness: 0.5,   // 金属っぽさ（0〜1）
    roughness: 0.2    // 粗さ（0〜1）
});

// メッシュ（形+質感）を作る
const cube = new THREE.Mesh(geometry, material);

// シーンに追加
scene.add(cube);
```

### 3. ライト（光）の種類

```javascript
// 環境光 - 全体を柔らかく照らす（影はできない）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

// ディレクショナルライト - 太陽のような平行光（影ができる）
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);

// ポイントライト - 電球のような点光源（全方向に光る）
const pointLight = new THREE.PointLight(0xff6b6b, 1, 100);
```

### 4. アニメーションの仕組み

```javascript
function animate() {
    // ① 次のフレームでこの関数をもう一度呼ぶ
    requestAnimationFrame(animate);

    // ② オブジェクトを動かす
    cube.rotation.x += 0.01;  // X軸で回転

    // ③ 画面に描画
    renderer.render(scene, camera);
}
```

この関数が1秒間に約60回呼ばれることで、滑らかなアニメーションになります。

## 🎨 カスタマイズしてみよう！

### 初心者向け：色を変える

`src/main.js`の以下の部分を変更してみましょう：

```javascript
// 立方体の色を変える（0x00ff88 → 0xff0000で赤色に）
const cubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,  // ← ここを変更！
    metalness: 0.5,
    roughness: 0.2
});
```

**色の指定方法（16進数カラーコード）**
- `0xff0000` → 赤
- `0x00ff00` → 緑
- `0x0000ff` → 青
- `0xffff00` → 黄色
- `0xff00ff` → マゼンタ
- `0x00ffff` → シアン

### 中級者向け：新しいオブジェクトを追加

円柱を追加してみましょう：

```javascript
// addObjects()関数の中に追加
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffff00,
    metalness: 0.6,
    roughness: 0.3l
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(0, 1, -2);  // 位置を設定
cylinder.castShadow = true;
scene.add(cylinder);
```

### 上級者向け：アニメーションを変える

`animate()`関数で新しい動きを追加：

```javascript
// トーラスを楕円軌道で動かす
torus.position.x = Math.cos(Date.now() * 0.001) * 3;
torus.position.z = Math.sin(Date.now() * 0.001) * 3;
```

## 🐛 トラブルシューティング

### 画面が真っ白/何も表示されない

1. ブラウザの開発者ツール（F12キー）を開く
2. Consoleタブでエラーメッセージを確認
3. よくある原因：
   - `npm install`を実行していない
   - ブラウザが古い（Chrome、Firefox、Edgeの最新版を推奨）

### 開発サーバーが起動しない

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
npm run dev
```

### ポートが既に使用されている

```
Port 5173 is in use
```

→ 別のアプリが同じポートを使っています。以下を試してください：

```bash
# Ctrl+Cで前のサーバーを停止してから、もう一度
npm run dev
```

## 📦 本番環境へのデプロイ

完成したら、Webサイトとして公開できます：

```bash
# ビルド（最適化されたファイルを生成）
npm run build
```

`dist`フォルダの中身を、以下のサービスにアップロードできます：

- **Vercel** - 無料、簡単（推奨）
- **Netlify** - 無料、簡単
- **GitHub Pages** - 無料、Gitの知識が必要

## 🛠️ 使用技術

| 技術 | 説明 | バージョン |
|------|------|-----------|
| **Three.js** | 3Dグラフィックスライブラリ | ^0.168.0 |
| **Vite** | 高速な開発サーバー・ビルドツール | ^5.4.0 |
| **ES Modules** | モダンなJavaScriptのモジュール機能 | - |

### Viteとは？

- 従来のWebpackより高速な開発サーバー
- ファイルを保存すると即座にブラウザに反映（Hot Module Replacement）
- 本番ビルドも高速

## 📚 学習リソース

### 公式ドキュメント
- [Three.js 公式ドキュメント](https://threejs.org/docs/) - 全機能のリファレンス
- [Three.js 公式サンプル](https://threejs.org/examples/) - 200以上のデモ

### 日本語チュートリアル
- [Three.js入門サイト ICS MEDIA](https://ics.media/tutorial-three/) - 日本語でわかりやすい
- [Three.js Journey](https://threejs-journey.com/) - 英語だが最高品質（有料）

### YouTube
- 「Three.js 入門」で検索すると日本語の解説動画が見つかります

### 学習の順序（おすすめ）

1. ✅ このプロジェクトで基本を理解
2. 色や形を変えて遊ぶ
3. テクスチャ（画像）を貼る
4. 3Dモデル（GLB/GLTF形式）を読み込む
5. シェーダー（高度な表現）に挑戦

## 💡 次のステップ

このプロジェクトをマスターしたら、以下に挑戦してみましょう：

- [ ] テクスチャ（画像）を3Dオブジェクトに貼る
- [ ] 3Dモデル（.glbファイル）を読み込む
- [ ] パーティクルエフェクト（星空など）を作る
- [ ] 物理演算（衝突判定）を追加
- [ ] VR対応にする
- [ ] シェーダーでカスタムエフェクトを作る

## ❓ よくある質問（FAQ）

**Q: プログラミング初心者でも大丈夫？**  
A: JavaScriptの基礎（変数、関数、配列）がわかれば大丈夫です。このコードはコメントが豊富なので、読みながら学べます。

**Q: ゲームを作れますか？**  
A: Three.jsは3D描画に特化しています。ゲームを作るなら、物理演算ライブラリ（Cannon.js、Ammo.jsなど）も組み合わせると良いでしょう。

**Q: スマホでも動きますか？**  
A: 動きますが、複雑な3Dシーンは重くなります。スマホ対応するには、オブジェクト数を減らすなどの最適化が必要です。

**Q: 商用利用できますか？**  
A: Three.jsはMITライセンスなので、商用利用OKです。このプロジェクトのコードも自由に使ってください。

## 🎉 最後に

Three.jsは奥が深く、学べば学ぶほど面白いライブラリです。  
まずはこのプロジェクトのコードを変更して、色々試してみてください。

**エラーを恐れずに、たくさん実験することが上達の近道です！**

楽しいコーディングを！Happy Coding! 🚀

---

### 📮 フィードバック

質問や改善提案があれば、お気軽にIssueを作成してください。

### 📄 ライセンス

MIT License - 自由に使用・改変・配布できます。

