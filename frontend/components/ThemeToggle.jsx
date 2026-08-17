'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[34px] h-[34px]" />;

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="w-[34px] h-[34px] rounded-lg border border-border bg-surface text-muted
                 flex items-center justify-center hover:bg-surface-alt hover:text-text transition-colors"
      title="Toggle theme"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5v1.2M8 13.3v1.2M14.5 8h-1.2M2.7 8H1.5M12.6 3.4l-.85.85M4.25 11.75l-.85.85M12.6 12.6l-.85-.85M4.25 4.25l-.85-.85"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}
