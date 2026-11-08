// 설정(시안 9번 화면). 알림 기능이 없어 '알림 설정' 대신 '요금표 관리'를 둔다(빈 메뉴 금지).
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useOverlay } from '../components/overlay';
import { Header, Row, Screen } from '../components/ui';
import { describeRule } from '../domain/fee';
import { deleteProfile } from '../domain/records';
import licenses from '../legal/oss-licenses.json';
import { useApp } from '../state/store';

export const APP_VERSION = '1.0.0';

export function Settings() {
  const navigate = useNavigate();
  const { state, wipe } = useApp();
  const { confirm, toast } = useOverlay();

  const wipeAll = async () => {
    const yes = await confirm({
      title: '모든 기록을 삭제할까요?',
      message: '진행 중인 주차, 지난 기록, 사진, 요금표, 최근 검색어가 이 기기에서 모두 지워지고 되돌릴 수 없어요.',
      confirmText: '모두 삭제',
      danger: true,
    });
    if (!yes) return;
    toast((await wipe()) ? '모든 기록을 삭제했어요' : '삭제하지 못했어요. 다시 시도해 주세요');
  };

  return (
    <Screen tabbar>
      <Header title="설정" back={false} />
      <div className="app-card">
        <img src="./brand/icon.svg" alt="" width={56} height={56} />
        <div>
          <strong>내 차 어딨지?</strong>
          <span className="muted">v{APP_VERSION}</span>
        </div>
      </div>
      <div className="rows">
        <Row icon="won" label="요금표 관리" value={state.rateProfiles.length ? `${state.rateProfiles.length}개` : undefined} onClick={() => navigate('/settings/rates')} />
        <Row icon="info" label="앱 정보" onClick={() => navigate('/settings/about')} />
        <Row icon="doc" label="이용약관" onClick={() => navigate('/settings/terms')} />
        <Row icon="lock" label="개인정보 처리방침" onClick={() => navigate('/settings/privacy')} />
        <Row icon="list" label="오픈소스 라이선스" onClick={() => navigate('/settings/licenses')} />
        <Row icon="help" label="고객센터" onClick={() => navigate('/settings/support')} />
      </div>
      <button type="button" className="danger-btn" onClick={wipeAll}>
        <Icon name="trash" size={18} /> 모든 기록 삭제
      </button>
    </Screen>
  );
}

const TITLES: Record<string, string> = {
  rates: '요금표 관리',
  about: '앱 정보',
  terms: '이용약관',
  privacy: '개인정보 처리방침',
  licenses: '오픈소스 라이선스',
  support: '고객센터',
};

export function SettingsPage() {
  const { page = '' } = useParams();
  if (!TITLES[page]) return <Navigate to="/settings" replace />;
  return (
    <Screen>
      <Header title={TITLES[page]} />
      <article className="doc">
        {page === 'rates' && <Rates />}
        {page === 'about' && <About />}
        {page === 'terms' && <Terms />}
        {page === 'privacy' && <Privacy />}
        {page === 'licenses' && <Licenses />}
        {page === 'support' && <Support />}
      </article>
    </Screen>
  );
}

function Rates() {
  const { state, commit } = useApp();
  const { confirm } = useOverlay();
  if (!state.rateProfiles.length) return <p>저장한 요금표가 없어요. 주차 중 타이머 화면에서 요금표를 입력하면 주차장 이름으로 저장돼 다음에 불러올 수 있어요.</p>;
  return (
    <>
      <p>최근 저장한 요금표 5개까지 보관해요. 지워도 이미 기록된 주차의 예상 요금은 바뀌지 않아요.</p>
      <ul className="profile-list">
        {state.rateProfiles.map((p) => (
          <li key={p.name}>
            <div>
              <strong>{p.name}</strong>
              <span className="muted">{describeRule(p.rule)}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label={`${p.name} 요금표 삭제`}
              onClick={async () => {
                if (await confirm({ title: `‘${p.name}’ 요금표를 지울까요?`, confirmText: '지우기', danger: true })) commit((s) => deleteProfile(s, p.name));
              }}
            >
              <Icon name="trash" size={18} color="var(--c-text-3)" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function About() {
  return (
    <>
      <h2>내 차 어딨지?</h2>
      <p>내 차 위치부터 예상 주차요금까지. 주차한 순간의 위치·층·구역·사진을 남기고, 주차 시간과 직접 입력한 요금표로 예상 요금을 확인해요.</p>
      <h2>이렇게 동작해요</h2>
      <ul>
        <li>위치는 ‘현재 위치 가져오기’를 누를 때만 한 번 확인해요. 실내·지하에서는 GPS가 부정확할 수 있어 층·구역·번호를 함께 적어 두는 게 좋아요.</li>
        <li>주차 시간은 저장한 시작 시각 기준으로 계산해요. 앱을 닫아도 시간이 이어져요.</li>
        <li>예상 요금은 사용자가 입력한 단순 요금표(무료 시간·기본 요금·추가 요금·1회 최대 요금)로만 계산해요. 일 최대요금, 심야·주말 요금, 할인, 회차 무료는 반영하지 않아요.</li>
        <li>실제 결제·정산은 하지 않아요. 결제는 주차장 정산기에서 해 주세요.</li>
        <li>모든 기록은 이 기기에만 저장돼요. 기기를 바꾸거나 토스 앱 데이터를 지우면 사라질 수 있어요.</li>
      </ul>
      <p className="muted">버전 {APP_VERSION}</p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h2>제1조 (목적)</h2>
      <p>이 약관은 ‘내 차 어딨지?’(이하 ‘서비스’)의 이용 조건을 정해요. 서비스는 토스 앱 안에서 제공되는 주차 기록 도구예요.</p>
      <h2>제2조 (서비스 내용)</h2>
      <p>서비스는 주차 위치·층·구역·사진·메모 기록, 주차 경과 시간 표시, 사용자가 입력한 요금표 기반 예상 요금 계산을 제공해요. 회원가입과 로그인이 필요 없어요.</p>
      <h2>제3조 (예상 요금의 한계)</h2>
      <p>표시되는 요금은 사용자가 입력한 요금표로 계산한 ‘예상’ 금액이며 실제 청구 금액이 아니에요. 할인, 일 최대요금, 시간대·요일별 요금, 운영사 정산 규칙 차이로 실제 금액과 다를 수 있어요. 서비스는 결제·정산 기능을 제공하지 않아요.</p>
      <h2>제4조 (위치 정보의 정확도)</h2>
      <p>기기의 GPS로 측정한 위치는 주차장 주변을 가리킬 수 있으며 지하·실내의 정확한 주차면을 보장하지 않아요.</p>
      <h2>제5조 (데이터 보관)</h2>
      <p>기록은 사용자 기기에만 저장돼요. 기기 변경, 앱 삭제, 데이터 초기화 시 복구할 수 없어요. 서비스는 서버에 기록을 백업하지 않아요.</p>
      <h2>제6조 (책임의 제한)</h2>
      <p>서비스는 기록을 돕는 도구로, 사용자가 입력한 정보와 기기 측정값의 정확성, 주차 요금 차이, 기록 유실로 생긴 손해에 대해 고의 또는 중대한 과실이 없는 한 책임지지 않아요.</p>
      <p className="muted">시행일: 2026년 11월 8일</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <p>‘내 차 어딨지?’는 개인정보를 서버로 수집하지 않아요. 아래 정보는 사용자의 기기 안(토스 앱의 미니앱 저장소)에만 저장돼요.</p>
      <h2>기기에 저장하는 정보</h2>
      <ul>
        <li>주차 위치 좌표와 측정 오차: ‘현재 위치 가져오기’를 눌렀을 때만 한 번 측정</li>
        <li>주차 사진: ‘사진 찍기’를 눌렀을 때만 촬영, 최근 10개 기록까지만 보관</li>
        <li>주차장 이름, 층·구역·번호, 메모, 주차 시작·종료 시각, 요금표, 직접 입력한 정산 금액, 최근 검색어</li>
      </ul>
      <h2>외부 전송</h2>
      <p>위 정보는 외부 서버로 보내지 않아요. ‘지도에서 보기’를 누르면 저장된 좌표와 장소 이름이 담긴 카카오맵 링크가 열리고, 이때 해당 지도 서비스의 처리방침이 적용돼요.</p>
      <h2>권한</h2>
      <ul>
        <li>위치: 주차 위치 기록(거부해도 직접 입력으로 이용 가능)</li>
        <li>카메라: 주변 사진 촬영(선택)</li>
        <li>클립보드: 좌표 복사</li>
      </ul>
      <h2>보관과 삭제</h2>
      <p>완료 기록은 최근 50개까지 보관하고 오래된 것부터 자동으로 지워요. 설정 &gt; 모든 기록 삭제로 언제든 전부 지울 수 있고, 토스 앱에서 미니앱 데이터를 지워도 삭제돼요.</p>
      <h2>문의</h2>
      <p>앱인토스에 등록된 문의 채널(토스 앱 &gt; 미니앱 정보)로 연락해 주세요.</p>
      <p className="muted">시행일: 2026년 11월 8일</p>
    </>
  );
}

function Licenses() {
  const list = (licenses as { packages?: { name: string; version: string; license: string }[] }).packages ?? [];
  return (
    <>
      <p>이 앱은 다음 오픈소스 소프트웨어를 사용해요.</p>
      <ul className="license-list">
        {list.map((p) => (
          <li key={`${p.name}@${p.version}`}>
            <strong>{p.name}</strong> <span className="muted">{p.version} · {p.license}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Support() {
  return (
    <>
      <h2>자주 묻는 질문</h2>
      <p><strong>위치가 실제와 달라요.</strong><br />지하·실내에서는 GPS 오차가 커요. 층·구역·기둥 번호와 사진을 함께 남겨 주세요.</p>
      <p><strong>예상 요금이 정산기와 달라요.</strong><br />입력한 요금표로만 계산해요. 할인·일 최대요금·시간대별 요금은 반영되지 않아요.</p>
      <p><strong>기록이 사라졌어요.</strong><br />기록은 기기에만 저장돼요. 기기 변경·토스 앱 데이터 삭제 시 복구할 수 없어요.</p>
      <h2>문의하기</h2>
      <p>토스 앱에서 이 미니앱의 정보 화면에 있는 문의 채널로 연락해 주세요.</p>
    </>
  );
}
