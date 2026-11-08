// 토스트와 확인 대화상자(삭제·종료·덮어쓰기 전에 반드시 확인).
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface OverlayCtx {
  toast: (msg: string) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<OverlayCtx | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
      {dialog && (
        <div className="dim" onClick={() => close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="dlg-title">{dialog.title}</h2>
            {dialog.message && <p>{dialog.message}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-soft" onClick={() => close(false)}>
                {dialog.cancelText ?? '취소'}
              </button>
              <button type="button" className={`btn ${dialog.danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>
                {dialog.confirmText ?? '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useOverlay(): OverlayCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('OverlayProvider 밖에서 useOverlay 호출');
  return c;
}
