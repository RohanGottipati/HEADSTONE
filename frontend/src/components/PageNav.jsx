import { Link, useLocation } from 'react-router-dom';

const navItem = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  padding: '6px 0',
};

const activeStyle = {
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--accent)',
};

const NAV = [
  { to: '/', label: 'Cover' },
  { to: '/results', label: 'Notebook' },
  { to: '/products', label: 'Index' },
  { to: '/build', label: 'Build Plan' },
];

export default function PageNav() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(8,8,8,0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.1rem',
            color: 'var(--accent)',
            textDecoration: 'none',
            letterSpacing: '0.1em',
          }}
        >
          HEADSTONE
        </Link>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {NAV.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === '/products' && location.pathname.startsWith('/product'));
            return (
              <Link
                key={item.to}
                to={item.to}
                style={isActive ? { ...navItem, ...activeStyle } : navItem}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
