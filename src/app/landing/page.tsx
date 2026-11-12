import type { Metadata } from 'next';
import AdalLandingPage from '@/components/adal-clone/AdalLandingPage';

export const metadata: Metadata = {
  title: 'AdaL — Summon Your Agent Familiar | SylphAI',
  description: 'AdaL is the automation-first agent harness. She comes with personality and skills and aligns with your memory, so more is done with less of your time.',
};

export default function LandingRoute() {
  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#050505]">
      <AdalLandingPage />
    </main>
  );
}
