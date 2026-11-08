import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔 등록 appName과 정확히 같아야 업로드된다. 바꾸면 src/platform/toss.ts APP_NAME도 같이 바꾼다.
  appName: 'whereiscar',
  // camera: '사진 찍기'를 누를 때만 Device.openCamera
  // geolocation: '현재 위치 가져오기'를 누를 때만 Device.getLocation(거부해도 직접 입력으로 저장 가능)
  // clipboard: '좌표 복사'(Clipboard.setText)
  permissions: [
    { name: 'camera', access: 'access' },
    { name: 'geolocation', access: 'access' },
    { name: 'clipboard', access: 'write' },
  ],
  // 토스 내비게이션 바의 뒤로가기를 쓰고, 토스 안에서는 화면 안 뒤로가기를 그리지 않는다(중복 노출 금지)
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
  },
  webBundleDir: 'dist',
});
