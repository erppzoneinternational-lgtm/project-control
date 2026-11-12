/**
 * Auth route group layout — no sidebar, no AppShell.
 * Just renders auth pages full-screen.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
