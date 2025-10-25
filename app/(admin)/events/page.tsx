import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase';

async function createEvent(formData: FormData) {
  'use server';
  const supabase = createSupabaseServerClient();
  const name = formData.get('name')?.toString();
  const startAt = formData.get('start_at')?.toString();
  const endAt = formData.get('end_at')?.toString();

  if (!name || !startAt || !endAt) {
    throw new Error('Todos os campos são obrigatórios');
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Datas inválidas');
  }

  const { error } = await supabase.from('events').insert({
    name,
    start_at: start.toISOString(),
    end_at: end.toISOString()
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/(admin)/events');
}

async function deleteEvent(formData: FormData) {
  'use server';
  const supabase = createSupabaseServerClient();
  const id = formData.get('id')?.toString();
  if (!id) {
    throw new Error('ID inválido');
  }
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/(admin)/events');
}

export default async function EventsPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-3">Criar evento</h2>
        <form action={createEvent} className="grid">
          <input name="name" placeholder="Nome do evento" required />
          <label>
            Início
            <input type="datetime-local" name="start_at" required />
          </label>
          <label>
            Fim
            <input type="datetime-local" name="end_at" required />
          </label>
          <button className="button" type="submit">
            Salvar evento
          </button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Eventos cadastrados</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Início</th>
              <th>Fim</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
              data.map((event) => (
                <tr key={event.id}>
                  <td>{event.name}</td>
                  <td>{new Date(event.start_at).toLocaleString('pt-BR')}</td>
                  <td>{new Date(event.end_at).toLocaleString('pt-BR')}</td>
                  <td>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={event.id} />
                      <button className="button" type="submit">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-sm text-slate-300">
                  Nenhum evento cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
