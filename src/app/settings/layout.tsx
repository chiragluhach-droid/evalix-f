import AppShell from '@/components/AppShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell role={['admin', 'teacher', 'student']}>{children}</AppShell>;
}
