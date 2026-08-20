# 크레딧

## 게임 엔진 — Marble Roulette

- 원본: [lazygyu/roulette](https://github.com/lazygyu/roulette)
- 라이선스: MIT
- 물리 엔진: [box2d-wasm](https://github.com/Birch-san/box2d-wasm) (`assets/ao29o.js`, `assets/dRxiZ.js`, `assets/*.wasm`)

`assets/roulette.js` 는 원본 프로젝트의 **빌드 결과물(번들, minify 상태)** 이다.
원본에서 손댄 곳은 두 군데뿐이다.

- 캔버스 폰트 `sans-serif` → `Galmuri11, sans-serif`
- 맵 배열을 `window.__marbleMaps` 로 노출 (맵을 추가할 수 있게)

게임 내부 로직(맵, 스킬, 물리)을 크게 고치려면 원본 저장소를 클론해서
소스를 수정하고 다시 빌드하는 편이 낫다.

화면 UI(`index.html` / `assets/ui.css` / `assets/app.js`)는 이 저장소에서 새로 만든 것이다.

## 폰트 — 갈무리11 (Galmuri11)

- 원본: [quiple/galmuri](https://github.com/quiple/galmuri)
- 저작권: Copyright (c) 2019–2025 Lee Minseo (quiple@quiple.dev)
- 라이선스: SIL Open Font License 1.1 — 전문은 [`assets/fonts/LICENSE.txt`](assets/fonts/LICENSE.txt)

## 아이콘

설정 패널의 아이콘은 [Font Awesome Free 6](https://fontawesome.com/license/free) (CC BY 4.0) 이며,
원본 빌드에서 CSS 마스크 이미지로 인라인된 상태 그대로 가져왔다.
