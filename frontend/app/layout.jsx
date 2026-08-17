import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'Insightify — Agent Management',
  description: 'Team & agent management for campaign operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
