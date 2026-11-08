# 내 차 어딨지? 작업 규칙 (요약)

원본 기획: `docs/SUPER_PROMPT.md`(파킹로그 → 이름 변경). 디자인 기준: `docs/design/reference.webp`. 결정: `docs/DECISIONS.md`.

- 모든 답변·문서·커밋 메시지는 한국어.
- 앱 이름은 **내 차 어딨지?**, appName `whereiscar`(바꾸면 `apps-in-toss.config.ts`와 `src/platform/toss.ts` APP_NAME 같이).
- 앱인토스 API는 추측하지 않는다: `node_modules/@apps-in-toss/web-framework/dist/index.d.ts`와 공식 문서로 확인하고 DECISIONS에 근거를 남긴다.
- SDK 호출은 `src/platform/toss.ts`·`src/storage/kv.ts`에서만. `src/domain/`은 순수 TS(DOM·SDK 의존 금지).
- 위치·카메라는 사용자가 버튼을 누를 때만 1회. 진입 즉시 권한·바텀시트 금지. 서버 전송 금지.
- 금액은 항상 '예상 요금'(사용자 입력 요금표 기준). 결제·정산 기능 만들지 않음. 요금표 없으면 금액 표시 금지.
- 색·간격은 `src/styles/design-tokens.css`만. 아이콘 원본은 시안 `docs/design/reference.webp` → `npm run icons`(scripts/build-app-icons.py).
- 상태는 `구현` / `자동 테스트 통과` / `브라우저 확인` / `샌드박스 확인` / `토스앱 확인`으로 구분해 README에 기록. 확인 안 한 것을 완료로 보고하지 않는다.
- 검사: `npm test`, `npm run typecheck`, `npm run build`, 업로드 번들 `npm run build:ait`.
- README 맨 아래 Work Log는 작업 마지막에 갱신.
