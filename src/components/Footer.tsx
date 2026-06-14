// src/components/Footer.tsx

export default function Footer() {
  return (
    <>
      <style>{`
        .cb-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          background: #040d18;
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          font-family: 'Barlow', sans-serif;
        }
        .cb-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: rgba(240,236,224,0.25);
        }
        .cb-footer-cross { color: rgba(201,169,74,0.4); font-size: 12px; }
        .cb-footer-links {
          display: flex;
          gap: 18px;
        }
        .cb-footer-links a {
          font-size: 11px;
          color: rgba(240,236,224,0.3);
          text-decoration: none;
          transition: color .2s;
        }
        .cb-footer-links a:hover { color: #C9A94A; }

        @media (max-width: 500px) {
          .cb-footer { padding: 14px 16px; justify-content: center; text-align: center; }
        }
      `}</style>

      <footer className="cb-footer">
        <div className="cb-footer-left">
          <span className="cb-footer-cross">✝</span>
          <span>© {new Date().getFullYear()} Confessed · Contributor &amp; Admin Portal</span>
        </div>
        <div className="cb-footer-links">
          <a href="https://confessed.faith">confessed.faith</a>
          <a href="https://confessed.faith/statement-of-faith">Statement of Faith</a>
          <a href="https://confessed.faith/privacy">Privacy</a>
        </div>
      </footer>
    </>
  )
}
