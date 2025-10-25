import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para rodar o seed.');
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const eventName = 'Evento demonstração';
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      name: eventName,
      start_at: start.toISOString(),
      end_at: end.toISOString()
    })
    .select('*')
    .single();

  if (eventError) {
    throw eventError;
  }

  const tickets = Array.from({ length: 5 }).map(() => {
    const token = crypto.randomUUID();
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return {
      token,
      row: {
        event_id: event.id,
        token_hash: hash,
        status: 'issued'
      }
    };
  });

  const { error: ticketError } = await supabase
    .from('tickets')
    .insert(tickets.map((item) => item.row));

  if (ticketError) {
    throw ticketError;
  }

  console.log('Seed criado com sucesso! Tokens:');
  tickets.forEach((ticket, index) => {
    console.log(`#${index + 1}: ${ticket.token}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
