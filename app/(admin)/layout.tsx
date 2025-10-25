import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const role =
    (session.user.app_metadata?.role as string | undefined) ??
    (session.user.user_metadata?.role as string | undefined);

  if (role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-4 text-sm text-slate-300">
        <Link href="/">Dashboard</Link>
        <Link href="/(admin)/events">Eventos</Link>
        <Link href="/(admin)/tickets">Tickets</Link>
        <form
          action="/auth/signout"
          method="post"
          style={{ marginLeft: 'auto' }}
        >
          <button className="button" type="submit">
            Sair
          </button>
        </form>
      </nav>
      <div className="card">{children}</div>
    </div>
  );
}
