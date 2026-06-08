// src/pages/Gate.tsx
import { useClerk } from '@clerk/clerk-react'

type Props = {
  role?: string | null
  signedOut?: boolean
}

export default function Gate({ role, signedOut }: Props) {
  const { openSignIn } = useClerk()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Barlow:wght@400;500;600;700&display=swap');
        .gate {
          min-height: calc(100vh - 60px);
          background: #080f1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Barlow', sans-serif;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .gate::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .gate-card {
          position: relative;
          z-index: 2;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        .gate-cross {
          font-size: 32px;
          color: #C9A94A;
          display: block;
          margin-bottom: 24px;
          animation: pulse 2s ease-in-out infinite;
        }
        .gate-title {
          font-family: 'EB Garamond', serif;
          font-size: 36px;
          color: #f0ece0;
          margin-bottom: 8px;
        }
        .gate-title em { font-style: italic; color: #C9A94A; }
        .gate-sub {
          font-size: 14px;
          color: rgba(240,236,224,0.4);
          line-height: 1.7;
          margin-bottom: 40px;
        }
        .gate-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,169,74,0.2), transparent);
          margin-bottom: 40px;
        }
        .gate-actions { display: flex; flex-direction: column; gap: 12px; }
        .gate-btn {
          padding: 13px 24px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: 'Barlow', sans-serif;
          letter-spacing: .04em; transition: all .2s; text-decoration: none;
          display: block; text-align: center;
        }
        .gate-btn.primary { background: #C9A94A; color: #080f1a; border: none; }
        .gate-btn.primary:hover { background: #b89840; }
        .gate-btn.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: rgba(240,236,224,0.65); }
        .gate-btn.ghost:hover { border-color: rgba(201,169,74,0.3); color: #f0ece0; }
        .gate-verse {
          margin-top: 48px;
          font-family: 'EB Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: rgba(240,236,224,0.2);
          line-height: 1.7;
        }
        .gate-verse cite {
          display: block; margin-top: 6px; font-size: 10px; letter-spacing: .12em;
          color: rgba(201,169,74,0.3); font-style: normal; font-weight: 600; text-transform: uppercase;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      <div className="gate">
        <div className="gate-card">
          <span className="gate-cross">✝</span>

          {signedOut ? (
            <>
              <h1 className="gate-title">Welcome to <em>Contribute</em></h1>
              <p className="gate-sub">
                This is the Confessed contributor and admin portal.<br />
                Sign in to continue.
              </p>
              <div className="gate-divider" />
              <div className="gate-actions">
                <button className="gate-btn primary" onClick={() => openSignIn()}>
                  Sign in to Confessed
                </button>
                <a href="https://confessed.faith" className="gate-btn ghost">
                  Return to confessed.faith
                </a>
              </div>
            </>
          ) : (
            <>
              <h1 className="gate-title">Access <em>Restricted</em></h1>
              <p className="gate-sub">
                You don't have contributor access yet.<br />
                Apply to become a contributor to access this portal.
              </p>
              <div className="gate-divider" />
              <div className="gate-actions">
                <a href="https://confessed.faith/apply" className="gate-btn primary">
                  Apply to become a contributor
                </a>
                <a href="https://confessed.faith" className="gate-btn ghost">
                  Return to confessed.faith
                </a>
              </div>
            </>
          )}

          <div className="gate-verse">
            "If you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved."
            <cite>Romans 10:9 · ESV</cite>
          </div>
        </div>
      </div>
    </>
  )
}
