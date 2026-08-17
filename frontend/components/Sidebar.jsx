'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { roleLabel } from '../lib/utils';

const navItems = [
  { label: 'Teams', href: '/' },
  { label: 'Daily Report', href: '/daily-report' },
];

export default function Sidebar({ campaigns = [], activeCampaignTag, onSelectCampaign }) {
  const { user, logout, hasPermission } = useAuth();
  const pathname = usePathname();

  // Agents only get the Daily Report tab — they don't manage teams/rosters.
  let items = user?.role === 'agent' ? navItems.filter((i) => i.href !== '/') : navItems;
  if (hasPermission('roles.manage')) items = [...items, { label: 'Roles', href: '/roles' }];
  if (user?.role === 'admin') items = [...items, { label: 'Users', href: '/users' }];

  return (
    <aside className="hidden md:flex flex-col gap-6 w-60 shrink-0 bg-surface border-r border-border p-4">
      <div className="flex items-center gap-2 px-2">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-extrabold text-xs">
          R
        </div>
        <span className="font-bold text-[15px] tracking-tight">Insightify</span>
      </div>

      <nav>
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide px-2.5 mb-1.5">
          Workspace
        </div>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block px-2.5 py-2 rounded-md text-[13.5px] font-medium cursor-pointer transition-colors ${
                active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-alt hover:text-text'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {pathname === '/' && (
        <div>
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wide px-2.5 mb-1.5">
            Campaigns
          </div>
          <div className="flex flex-col gap-0.5">
            {campaigns.map((c) => {
              const active = c.tag === activeCampaignTag;
              return (
                <div
                  key={c.tag}
                  onClick={() => onSelectCampaign?.(c.tag)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                    active ? 'bg-accent-soft' : 'hover:bg-surface-alt'
                  }`}
                >
                  <span className={`text-[13px] ${active ? 'text-accent font-semibold' : 'text-text'}`}>
                    {c.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                    {c.tag}
                  </span>
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div className="text-[12px] text-muted px-2.5 py-1.5">No campaigns yet</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
            pathname === '/profile' ? 'border-accent bg-accent-soft' : 'border-border'
          }`}
        >
          <Link href="/profile" className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[11px] shrink-0">
              {(user?.fullName || '??').slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight overflow-hidden flex-1">
              <div className="font-semibold text-[12.5px] truncate">{user?.fullName || '—'}</div>
              <div className="text-[11px] text-muted">{roleLabel(user?.role)}</div>
            </div>
          </Link>
          <button
            onClick={logout}
            title="Sign out"
            className="text-muted hover:text-danger text-[11px] font-semibold shrink-0"
          >
            Exit
          </button>
        </div>
        <p className="text-center text-[10.5px] text-muted mt-2">Powered by Rehan R.</p>
      </div>
    </aside>
  );
}
