// 해시 라우팅: 앱인토스는 dist 정적 파일을 그대로 열기 때문에 서버 경로 재작성에 기대지 않는다.
// 흐름: (첫 진입) 소개 → 홈 → 주차 시작 → 타이머 → 요금표 → 주차 종료 → 기록
import { useEffect } from 'react';
import { createHashRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { OverlayProvider, useOverlay } from './components/overlay';
import { Detail } from './screens/Detail';
import { Editor } from './screens/Editor';
import { EndParking } from './screens/EndParking';
import { Home } from './screens/Home';
import { Intro } from './screens/Intro';
import { RateEditor } from './screens/RateEditor';
import { Records } from './screens/Records';
import { Search } from './screens/Search';
import { Settings, SettingsPage } from './screens/Settings';
import { Stats } from './screens/Stats';
import { Timer } from './screens/Timer';
import { AppProvider, useApp } from './state/store';

function Shell() {
  const { ready, corrupted, dismissCorrupted } = useApp();
  const { toast } = useOverlay();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (corrupted) {
      toast('저장된 기록을 읽지 못해 새로 시작해요');
      dismissCorrupted();
    }
  }, [corrupted, toast, dismissCorrupted]);
  if (!ready) return <div className="boot" aria-busy="true" />;
  return <Outlet />;
}

const router = createHashRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/intro', element: <Intro /> },
      { path: '/park/new', element: <Editor /> },
      { path: '/park/:id/edit', element: <Editor /> },
      { path: '/timer', element: <Timer /> },
      { path: '/rate', element: <RateEditor /> },
      { path: '/record/:id', element: <Detail /> },
      { path: '/record/:id/end', element: <EndParking /> },
      { path: '/records', element: <Records /> },
      { path: '/search', element: <Search /> },
      { path: '/stats', element: <Stats /> },
      { path: '/settings', element: <Settings /> },
      { path: '/settings/:page', element: <SettingsPage /> },
      { path: '*', element: <Home /> },
    ],
  },
]);

export function App() {
  return (
    <AppProvider>
      <OverlayProvider>
        <RouterProvider router={router} />
      </OverlayProvider>
    </AppProvider>
  );
}
