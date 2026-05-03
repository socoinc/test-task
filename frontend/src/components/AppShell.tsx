import { ReactNode } from 'react';

type AppShellProps = {
  title: string;
  subtitle: string;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">PM</div>
          <h1>PromoCode Manager</h1>
          <p>Operations dashboard for auth, orders, promo flows, and analytics.</p>
        </div>

        <nav className="sidebar-nav">
          <a href="#users">Users</a>
          <a href="#promocodes">Promocodes</a>
          <a href="#usages">Promo usages</a>
          <a href="#actions">Actions</a>
        </nav>

        <button className="ghost-button" onClick={onLogout} type="button">
          Log out
        </button>
      </aside>

      <main className="app-main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Analytics workspace</p>
            <h2>{title}</h2>
            <span>{subtitle}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
