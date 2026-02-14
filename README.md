# 暗夜客室 1:00am

Serial Experiments Lain をモチーフにした、ブラウザ上で展開されるインタラクティブな3Dヴィジュアル作品です。静かな夜の客室、微かな環境音、そしてワイヤードとの境界線を表現しています。

## 🌌 Overview
このプロジェクトは、低ポリゴンモデルと現代のWeb技術（Three.js / GSAP）を組み合わせ、特定の空気感を再現する試みです。
スクロールに合わせて霧が晴れ、テキストが浮かび上がる演出を取り入れています。

## 🛠 Tech Stack
- **Engine**: Three.js (WebGL)
- **Animation**: GSAP (ScrollTrigger)
- **Modeling**: Blockbench / Spline
- **Audio**: Web Audio API (Precise Looping)
- **Deployment**: Netlify

## 🎨 Key Features
- **Seamless Ambient**: Web Audio APIによる、途切れない環境音のループ実装。
- **Dynamic Fog**: SVGフィルター（feDisplacementMap）とGSAPを連動させた、有機的な霧の演出。
- **Optimized Assets**: モデル全体で800KB、テクスチャ60KB。
- **Responsive Camera**: デバイスのアスペクト比に応じたFOVの自動最適化。

## Technical Optimization
パフォーマンスとユーザー体験の両立のため、以下の最適化を行っています。

- **Font Lightweighting**: 
  - 元ファイル11MBのフォントを、使用文字のみに抽出するサブセット化を実施。
  - `woff2` 形式への変換により、最終的に123KBまで軽量化。
- **High Performance**:
  - Lighthouse Performance Score: PC 95 / Mobile 60。
  - 3Dレンダリングとリッチな演出を維持。
- **Responsive Control**:
  - `gsap.matchMedia` を採用。
  - デバイスサイズの変化に応じてアニメーション設定を動的にリセットし、破綻のないスクロール体験を実装。

## 🔗 Live Demo
[https://am1-room.netlify.app/](https://am1-room.netlify.app/)

## License
This project is for fan art purposes.
Inspired by "Serial Experiments Lain".
© 2026 Shinya
