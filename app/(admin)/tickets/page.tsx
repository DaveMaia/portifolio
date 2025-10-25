import { TicketGenerator } from '@/components/TicketGenerator';
import { createSupabaseServerClient } from '@/lib/supabase';

export default async function TicketsPage() {
  const supabase = createSupabaseServerClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const eventList = events ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Gerar tickets</h2>
      {eventList.length ? (
        <TicketGenerator
          events={eventList}
          scanBaseUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}
        />
      ) : (
        <p className="text-sm text-slate-300">
          Cadastre um evento antes de emitir tickets.
        </p>
      )}
    </div>
  );
}
