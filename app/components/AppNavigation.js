'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const groups = [
  {
    label: 'Learn',
    items: [
      { href: '/', label: 'Chapters', icon: 'grid' },
      { href: '/study', label: 'Study notes', icon: 'book' },
      { href: '/coverage', label: 'Syllabus map', icon: 'map' },
    ],
  },
  {
    label: 'Test',
    items: [
      { href: '/mock', label: 'Mock tests', icon: 'timer' },
      { href: '/pyq', label: 'Previous papers', icon: 'paper' },
    ],
  },
  {
    label: 'Review',
    items: [
      { href: '/mock/history', label: 'Mock history', icon: 'chart' },
      { href: '/revision', label: 'Revision list', icon: 'bookmark' },
      { href: '/stats', label: 'Performance', icon: 'pulse' },
    ],
  },
];

const paths = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  book: 'M5 4.5A3.5 3.5 0 0 1 8.5 8H12v12H8.5A3.5 3.5 0 0 0 5 23.5zM19 4.5A3.5 3.5 0 0 0 15.5 8H12v12h3.5a3.5 3.5 0 0 1 3.5 3.5z',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-8 3-3M9 2h6',
  paper: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7M14 3v5h5',
  chart: 'M4 19V9m6 10V5m6 14v-7m5 7H2',
  bookmark: 'M6 3h12v19l-6-4-6 4z',
  pulse: 'M3 12h4l2-6 4 12 3-8 2 2h3',
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function isActive(pathname, href) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/quiz/');
  if (href === '/mock') return pathname === '/mock' || /^\/mock\/(?!history(?:\/|$))[^/]+$/.test(pathname);
  if (href === '/stats' && pathname.startsWith('/practice/missed')) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'dark');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('gate-theme', next);
  }

  return (
    <>
      <header className="mobile-topbar">
        <Link href="/" className="mobile-brand" aria-label="GATE Psychology home">
          <span className="brand-mark">Ψ</span>
          <span>GATE Psychology</span>
        </Link>
        <div className="mobile-actions">
          <button className="mobile-theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}

      <aside className={`site-sidebar${open ? ' open' : ''}`}>
        <Link href="/" className="site-brand">
          <span className="brand-mark">Ψ</span>
          <span className="brand-copy">
            <strong>GATE Psychology</strong>
            <small>Personal study space</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={item.href}>
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <button className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀' : '☾'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="exam-card">
          <span className="exam-card-kicker">Target exam</span>
          <strong>GATE 2027</strong>
          <small>XH5 · Psychology</small>
          <div className="exam-card-line"><i /></div>
        </div>
      </aside>
    </>
  );
}
