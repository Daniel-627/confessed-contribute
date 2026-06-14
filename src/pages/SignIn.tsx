// src/pages/SignIn.tsx
import { SignIn as ClerkSignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Barlow:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .si-root {
          min-height: calc(100vh - 60px);
          display: flex;
          background: #080f1a;
          font-family: 'Barlow', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .si-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* LEFT PANEL */
        .si-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 56px 64px;
          background: #040d18;
          border-right: 1px solid rgba(201,169,74,0.12);
          position: relative;
          z-index: 1;
        }

        .si-left::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #C9A94A, transparent);
        }

        .si-logo { display: flex; align-items: center; gap: 10px; }
        .si-cross { color: #C9A94A; font-size: 24px; }
        .si-wordmark { font-size: 14px; font-weight: 700; letter-spacing: .22em; color: #f0ece0; }
        .si-sub { font-size: 11px; color: rgba(201,169,74,0.5); letter-spacing: .1em; margin-left: 4px; }

        .si-quote-block {}
        .si-verse {
          font-family: 'EB Garamond', serif;
          font-size: 19px;
          line-height: 1.75;
          color: rgba(240,236,224,0.55);
          font-style: italic;
          margin-bottom: 14px;
          max-width: 380px;
        }
        .si-ref {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .14em;
          color: #C9A94A;
          text-transform: uppercase;
        }

        .si-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .si-tag {
          font-size: 9px; font-weight: 600; letter-spacing: .14em;
          color: rgba(201,169,74,0.6); border: 1px solid rgba(201,169,74,0.2);
          padding: 5px 12px; border-radius: 100px;
        }

        /* RIGHT PANEL */
        .si-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 64px;
          position: relative;
          z-index: 1;
        }

        .si-form-wrap { width: 100%; max-width: 420px; }

        .si-heading { margin-bottom: 24px; text-align: left; }
        .si-heading h1 {
          font-size: 26px; font-weight: 600; color: #f0ece0;
          letter-spacing: .01em; margin-bottom: 5px;
        }
        .si-heading p { font-size: 14px; color: rgba(240,236,224,0.38); }

        /* Clerk overrides */
        .cl-rootBox, .cl-signIn-root { width: 100% !important; }
        .cl-card, .cl-cardBox {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
        }
        .cl-headerTitle, .cl-headerSubtitle { display: none !important; }

        .cl-formFieldInput {
          background: #081422 !important;
          background-color: #081422 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 8px !important;
          color: #f0ece0 !important;
          font-size: 14px !important;
          font-family: 'Barlow', sans-serif !important;
          padding: 10px 14px !important;
        }
        .cl-formFieldInput:focus {
          border-color: rgba(201,169,74,0.55) !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(201,169,74,0.08) !important;
        }
        .cl-formFieldInput:-webkit-autofill,
        .cl-formFieldInput:-webkit-autofill:hover,
        .cl-formFieldInput:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #081422 inset !important;
          -webkit-text-fill-color: #f0ece0 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
        }

        .cl-formFieldLabel {
          color: rgba(240,236,224,0.45) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: .1em !important;
          text-transform: uppercase !important;
        }

        .cl-formButtonPrimary {
          background: #C9A94A !important;
          color: #081422 !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          letter-spacing: .08em !important;
          border-radius: 8px !important;
          border: none !important;
        }
        .cl-formButtonPrimary:hover { background: #b89840 !important; }

        .cl-socialButtonsBlockButton {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          color: rgba(240,236,224,0.75) !important;
        }
        .cl-socialButtonsBlockButton:hover { background: rgba(255,255,255,0.08) !important; }
        .cl-socialButtonsBlockButtonText { color: rgba(240,236,224,0.75) !important; }

        .cl-dividerLine { background: rgba(255,255,255,0.08) !important; }
        .cl-dividerText { color: rgba(240,236,224,0.28) !important; font-size: 11px !important; }

        .cl-footer { background: transparent !important; border: none !important; box-shadow: none !important; }
        .cl-footerPages, .cl-internal-b3fm6y, .cl-badge,
        [data-localization-key="developmentMode"] { display: none !important; }
        .cl-footerAction { border-top: 1px solid rgba(255,255,255,0.06) !important; padding-top: 16px !important; margin-top: 8px !important; justify-content: flex-start !important; }
        .cl-footerActionText { color: rgba(240,236,224,0.35) !important; }
        .cl-footerActionLink { color: #C9A94A !important; font-weight: 600 !important; }
        .cl-identityPreviewText { color: rgba(240,236,224,0.8) !important; }
        .cl-identityPreviewEditButton { color: #C9A94A !important; }
        .cl-formFieldInputShowPasswordButton svg { color: rgba(240,236,224,0.35) !important; }
        .cl-otpCodeFieldInput {
          background: #081422 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: #f0ece0 !important;
          border-radius: 8px !important;
        }

        @media (max-width: 768px) {
          .si-left { display: none; }
          .si-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="si-root">
        <div className="si-left">
          <div className="si-logo">
            <span className="si-cross">✝</span>
            <span className="si-wordmark">CONFESSED</span>
            <span className="si-sub">· CONTRIBUTE</span>
          </div>

          <div className="si-quote-block">
            <p className="si-verse">
              "But who do you say that I am?" Peter answered him, "You are the Christ."
            </p>
            <p className="si-ref">Mark 8:29 · ESV</p>
          </div>

          <div className="si-tags">
            {['REFORMED', 'CONFESSIONAL', 'GOSPEL-CENTRED'].map(t => (
              <span key={t} className="si-tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="si-right">
          <div className="si-form-wrap">
            <div className="si-heading">
              <h1>Sign in to contribute</h1>
              <p>Access the Confessed contributor &amp; admin portal</p>
            </div>
            <ClerkSignIn routing="hash" />
          </div>
        </div>
      </div>
    </>
  )
}
