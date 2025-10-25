import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServiceRoleClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
  }

  const headerKey = request.headers.get('x-service-role-key');
  if (headerKey !== serviceKey) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const tokenPlain = body.tokenPlain as string | undefined;

  if (!tokenPlain) {
    return NextResponse.json({ error: 'TOKEN_REQUIRED' }, { status: 400 });
  }

  const hash = crypto.createHash('sha256').update(tokenPlain).digest('hex');
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc('validate_ticket_once', {
    p_token_hash: hash
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 404 });
  }

  return NextResponse.json(data);
}
