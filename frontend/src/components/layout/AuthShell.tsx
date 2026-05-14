import { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
}

const BARS = [28, 42, 35, 60, 48, 72, 55, 80];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="auth-art-glow-a" />
        <div className="auth-art-glow-b" />

        <div className="auth-art-brand">
          <div className="auth-art-mark">F</div>
          <div className="auth-art-brand-name">FARO</div>
        </div>

        <div className="auth-art-content">
          <div className="auth-art-headline">
            Finanțe atente,
            <br />
            respectate, organizate.
          </div>
          <div className="auth-art-desc">
            FARO pune toate veniturile, cheltuielile și bugetele într-un singur loc — limpede, fără
            supărări, în limba ta.
          </div>

          <div className="auth-ticker">
            <div className="auth-ticker-head">
              <div className="auth-ticker-label">Sold curent</div>
              <span className="auth-ticker-chip">
                <span className="chip-dot" style={{ background: '#0ab39c' }} />
                +4,2% lună
              </span>
            </div>
            <div className="auth-ticker-value">
              <span>14.382</span>
              <span className="frac">,50</span>
              <span className="cur">RON</span>
            </div>
            <div className="auth-ticker-bars">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className={`auth-ticker-bar${i === BARS.length - 1 ? ' last' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="auth-art-footer">© 2026 FARO · Proiect de licență</div>
      </div>

      <div className="auth-form-wrap">{children}</div>
    </div>
  );
}
