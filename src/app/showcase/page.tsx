import type { Metadata } from 'next';
import AdalLandingPage from '@/components/adal-clone/AdalLandingPage';

export const metadata: Metadata = {
  title: 'SylphAI AdaL Showcase | Web Clone',
  description: 'Pixel-perfect clone of SylphAI AdaL landing page built with clone-anywebsite recipe.',
};

export default function ShowcaseRoute() {
  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#050505]">
      <AdalLandingPage />
    </main>
  );
}
