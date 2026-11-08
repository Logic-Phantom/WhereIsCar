// 첫 진입 소개(한 번만). 권한 요청·바텀시트 없이 '시작하기'만 둔다.
import { useNavigate } from 'react-router-dom';
import { IntroScene } from '../components/Illustrations';
import { Button } from '../components/ui';
import { useApp } from '../state/store';

export function Intro() {
  const navigate = useNavigate();
  const { commit } = useApp();
  const start = async () => {
    await commit((s) => ({ ...s, onboarded: true }));
    navigate('/', { replace: true });
  };
  return (
    <div className="intro">
      <div className="intro-top">
        <img className="intro-logo" src="./brand/icon.svg" alt="" width={112} height={112} />
        <h1 className="intro-title">내 차 어딨지?</h1>
        <p className="intro-sub">Where's My Car</p>
        <p className="intro-hand">
          내 차 위치부터
          <br />
          예상 주차요금까지!
        </p>
      </div>
      <div className="intro-scene">
        <IntroScene />
      </div>
      <div className="intro-cta">
        <Button onClick={start}>시작하기</Button>
      </div>
    </div>
  );
}
