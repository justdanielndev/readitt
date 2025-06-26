import { HomepageView } from '@/components/HomepageView';
import { AuthGuard } from '@/components/AuthGuard';
export default function Home() {
  return (
    <AuthGuard>
      <HomepageView />
    </AuthGuard>
  );
}
