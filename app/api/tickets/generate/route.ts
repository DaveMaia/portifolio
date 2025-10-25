import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServiceRoleClient, createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const role =
    (session.user.app_metadata?.role as string | undefined) ??
    (session.user.user_metadata?.role as string | undefined);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem emitir tickets' }, { status: 403 });
  }

  const serviceClient = createSupabaseServiceRoleClient();
  const body = await request.json();
  const eventId = body.eventId as string | undefined;
  const quantity = Number(body.quantity ?? 0);

  if (!eventId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 200) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos' },
      { status: 400 }
    );
  }

  const { data: event, error: eventError } = await serviceClient
    .from('events')
    .select('id, name')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: 'Evento não encontrado' },
      { status: 404 }
    );
  }

  const tokens = Array.from({ length: quantity }).map((_, index) => {
    const tokenPlain = crypto.randomUUID();
    const hash = crypto.createHash('sha256').update(tokenPlain).digest('hex');
    return {
      serial: index + 1,
      tokenPlain,
      token_hash: hash,
      event_id: eventId,
      eventName: event.name
    };
  });

  const insertPayload = tokens.map(({ token_hash, event_id }) => ({
    token_hash,
    event_id,
    status: 'issued'
  }));

  const { error: insertError } = await serviceClient.from('tickets').insert(insertPayload);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tickets: tokens.map(({ serial, tokenPlain, eventName }) => ({
      serial,
      tokenPlain,
      eventName,
      eventId
    }))
  });
}
