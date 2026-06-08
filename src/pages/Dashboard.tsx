// src/pages/Dashboard.tsx
import { useUser } from '@clerk/clerk-react'

type Props = { role: string }

export default function Dashboard({ role }: Props) {
  const { user } = useUser()
  const name = user?.firstName ?? 'Contributor'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Barlow:wght@400;500;600;700&display=swap');
        .dash {
          min-height: calc(100vh - 60px);
          background: #080f1a;
          font-family: 'Barlow', sans-serif;
          color: #f0ece0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 32px;
          text-align: center;
          position: relative;
        }
        .dash::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .dash-inner { position: relative; z-index: 2; max-width: 600px; width: 100%; }
        .dash-greeting {
          font-family: 'EB Garamond', serif;
          font-size: clamp(32px, 5vw, 48px);
          color: #f0ece0;
          margin-bottom: 8px;
        }
        .dash-greeting em { font-style: italic; color: #C9A94A; }
        .dash-sub { font-size: 14px; color: rgba(240,236,224,0.35); margin-bottom: 48px; }
        .dash-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 48px;
        }
        .dash-card {
          background: #0b1929;
          padding: 28px 24px;
          text-align: center;
          transition: background .2s;
        }
        .dash-card:hover { background: #0f2035; }
        .dash-card-icon { font-size: 20px; color: #C9A94A; display: block; margin-bottom: 8px; }
        .dash-card-label { font-size: 10px; font-weight: 700; letter-spacing: .14em; color: rgba(240,236,224,0.35); text-transform: uppercase; margin-bottom: 4px; }
        .dash-card-val { font-family: 'EB Garamond', serif; font-size: 14px; color: rgba(240,236,224,0.5); font-style: italic; }
        .dash-coming {
          font-size: 9px; font-weight: 600; letter-spacing: .1em;
          color: rgba(201,169,74,0.4); border: 1px solid rgba(201,169,74,0.15);
          padding: 2px 8px; border-radius: 100px; display: inline-block; margin-top: 6px;
        }
        @media (max-width: 480px) { .dash-cards { grid-template-columns: 1fr; } }
      `}</style>

      <div className="dash">
        <div className="dash-inner">
          <h1 className="dash-greeting">Welcome, <em>{name}</em></h1>
          <p className="dash-sub">Your contributor dashboard is being prepared.</p>

          <div className="dash-cards">
            {[
              { icon: '✍', label: 'Articles', val: 'Write & publish' },
              { icon: '🎙', label: 'Podcasts', val: 'Upload audio' },
              { icon: '👤', label: 'Profile', val: 'Manage your profile' },
              { icon: '📊', label: 'Analytics', val: 'View your reach' },
            ].map(c => (
              <div key={c.label} className="dash-card">
                <span className="dash-card-icon">{c.icon}</span>
                <p className="dash-card-label">{c.label}</p>
                <p className="dash-card-val">{c.val}</p>
                <span className="dash-coming">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
