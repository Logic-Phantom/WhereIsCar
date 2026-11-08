// 공통 UI: 화면 틀·헤더·탭바·버튼·행·칩·세그먼트·썸네일.
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { isInToss } from '../platform/toss';
import { usePhoto } from '../state/store';
import { Icon, type IconName } from './Icon';
import { NoPhotoArt } from './Illustrations';

export function Screen({ children, tabbar = false, footer }: { children: ReactNode; tabbar?: boolean; footer?: ReactNode }) {
  return (
    <div className={`screen${tabbar ? ' has-tabbar' : ''}${footer ? ' has-footer' : ''}`}>
      <main className="screen-body">{children}</main>
      {footer && <div className="screen-footer">{footer}</div>}
      {tabbar && <TabBar />}
    </div>
  );
}

/**
 * 화면 제목 줄. 토스 안에서는 토스 내비게이션 바가 뒤로가기를 그리므로 화면 안 뒤로가기는 브라우저 미리보기에서만 보인다.
 */
export function Header({ title, right, back = true, align = 'center' }: { title: ReactNode; right?: ReactNode; back?: boolean; align?: 'center' | 'left' }) {
  const navigate = useNavigate();
  const showBack = back && !isInToss();
  return (
    <header className={`header header-${align}`}>
      <div className="header-side">
        {showBack && (
          <button className="icon-btn" aria-label="뒤로" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>
            <Icon name="chevron-left" size={24} />
          </button>
        )}
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-side header-right">{right}</div>
    </header>
  );
}

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/records', label: '기록', icon: 'history' },
  { to: '/settings', label: '설정', icon: 'gear' },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end replace className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  small,
  icon,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  disabled?: boolean;
  small?: boolean;
  icon?: IconName;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`btn btn-${variant}${small ? ' btn-sm' : ''}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={small ? 18 : 20} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" className={`card card-btn ${className}`} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={`card ${className}`}>{children}</div>;
}

export function Row({ icon, label, value, onClick, danger }: { icon?: IconName; label: ReactNode; value?: ReactNode; onClick?: () => void; danger?: boolean }) {
  const body = (
    <>
      {icon && <Icon name={icon} size={20} color={danger ? 'var(--c-danger)' : 'var(--c-text-2)'} />}
      <span className="row-label">{label}</span>
      {value != null && <span className="row-value">{value}</span>}
      {onClick && <Icon name="chevron-right" size={18} color="var(--c-text-4)" />}
    </>
  );
  return onClick ? (
    <button type="button" className={`row${danger ? ' row-danger' : ''}`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="row">{body}</div>
  );
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={`chip${active ? ' active' : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Thumb({ id, hasPhoto, size = 'md' }: { id: string; hasPhoto: boolean; size?: 'md' | 'lg' }) {
  const uri = usePhoto(id, hasPhoto);
  return <div className={`thumb thumb-${size}`}>{uri ? <img src={uri} alt="" /> : <NoPhotoArt />}</div>;
}

export function Notice({ children, tone = 'info', icon = 'info' }: { children: ReactNode; tone?: 'info' | 'warn'; icon?: IconName }) {
  return (
    <div className={`notice notice-${tone}`}>
      <Icon name={icon} size={20} />
      <div>{children}</div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {right}
    </div>
  );
}

export function Empty({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="car" size={30} color="var(--c-primary)" />
      </div>
      <p className="empty-title">{title}</p>
      {desc && <p className="empty-desc">{desc}</p>}
      {action}
    </div>
  );
}
