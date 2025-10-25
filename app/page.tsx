import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="grid two">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Área Administrativa</h2>
        <p className="text-sm text-slate-300 mb-4">
          Crie eventos e gere tickets a partir desta área protegida.
        </p>
        <div className="grid" style={{ gap: '0.5rem' }}>
          <Link className="button" href="/(admin)/events">
            Gerenciar eventos
          </Link>
          <Link className="button" href="/(admin)/tickets">
            Emitir tickets
          </Link>
        </div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Scanner</h2>
        <p className="text-sm text-slate-300 mb-4">
          Abra em um dispositivo móvel para validar tickets via QR Code.
        </p>
        <Link className="button" href="/scan">
          Abrir scanner
        </Link>
      </div>
    </div>
  );
}
