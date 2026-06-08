// src/components/Navbar.tsx
import { useClerk, useUser } from '@clerk/clerk-react'

type Props = { role: string | null }

export default function Navbar({ role }: Props) {
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <>
      <style>{`
        .cb-nav {
          height: 60px;
          background: #040d18;
          border-bottom: 1px solid rgba(201,169,74,0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          font-family: 'Barlow', system-ui, sans-serif;
          position: relative;
          z-index: 10;
        }
        .cb-nav::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C9A94A, transparent);
        }
        .cb-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .cb-cross { color: #C9A94A; font-size: 18px; }
        .cb-wordmark { font-size: 12px; font-weight: 700; letter-spacing: .2em; color: #f0ece0; }
        .cb-sub { font-size: 10px; letter-spacing: .1em; color: rgba(201,169,74,0.5); margin-left: 4px; }
        .cb-nav-right { display: flex; align-items: center; gap: 12px; }
        .cb-role {
          font-size: 9px; font-weight: 700; letter-spacing: .12em;
          padding: 3px 10px; border-radius: 100px; border: 1px solid; text-transform: uppercase;
        }
        .cb-role.admin { color: #81c784; border-color: rgba(129,199,132,0.3); }
        .cb-role.contributor { color: #C9A94A; border-color: rgba(201,169,74,0.3); }
        .cb-role.regular { color: rgba(240,236,224,0.4); border-color: rgba(255,255,255,0.1); }
        .cb-user { font-size: 12px; color: rgba(240,236,224,0.45); }
        .cb-signout {
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(240,236,224,0.45); padding: 6px 14px; border-radius: 6px;
          font-size: 12px; cursor: pointer; font-family: inherit; transition: all .2s;
        }
        .cb-signout:hover { border-color: rgba(255,255,255,0.2); color: rgba(240,236,224,0.8); }
        @media (max-width: 500px) {
          .cb-nav { padding: 0 16px; }
          .cb-user { display: none; }
        }
      `}</style>

      <nav className="cb-nav">
        <a href="https://confessed.faith" className="cb-nav-logo">
          <span className="cb-cross">✝</span>
          <span className="cb-wordmark">CONFESSED</span>
          <span className="cb-sub">· CONTRIBUTE</span>
        </a>
        <div className="cb-nav-right">
          {role && <span className={`cb-role ${role}`}>{role}</span>}
          {user && <span className="cb-user">{user.firstName ?? user.primaryEmailAddress?.emailAddress}</span>}
          {user && (
            <button className="cb-signout" onClick={() => signOut({ redirectUrl: 'https://confessed.faith' })}>
              Sign out
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
