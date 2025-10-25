'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SUCCESS_COLOR = '#22c55e';
const ERROR_COLOR = '#ef4444';

function extractToken(raw: string) {
  try {
    const url = new URL(raw);
    return url.searchParams.get('tok');
  } catch (err) {
    const match = /tok=([\w-]+)/.exec(raw);
    return match ? match[1] : null;
  }
}

const beep = typeof Audio !== 'undefined'
  ? new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
    )
  : null;

export default function ScanPage() {
  const [message, setMessage] = useState('Aponte a câmera para um QR Code válido.');
  const [statusColor, setStatusColor] = useState('');
  const lastToken = useRef<string | null>(null);
  const sharedSecret = process.env.NEXT_PUBLIC_VALIDATE_SERVICE_KEY ?? '';

  const requestHeaders = useMemo(() => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (sharedSecret) {
      headers.set('x-service-role-key', sharedSecret);
    }
    return headers;
  }, [sharedSecret]);

  const scheduleReset = () => {
    setTimeout(() => {
      lastToken.current = null;
    }, 1500);
  };

  useEffect(() => {
    let scanner: any;
    let isCancelled = false;

    async function initScanner() {
      const html5 = await import('html5-qrcode');
      if (isCancelled) return;
      const { Html5QrcodeScanner } = html5;
      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        false
      );

      scanner.render(async (decodedText: string) => {
        const token = extractToken(decodedText);
        if (!token) {
          setStatusColor(ERROR_COLOR);
          setMessage('QR Code inválido.');
          scheduleReset();
          return;
        }

        if (token === lastToken.current) {
          return;
        }
        lastToken.current = token;

        try {
          setStatusColor('');
          setMessage('Validando...');
          const response = await fetch('/api/validate', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ tokenPlain: token })
          });
          const payload = await response.json();

          if (!response.ok || !payload.ok) {
            setStatusColor(ERROR_COLOR);
            setMessage(payload.message ?? payload.error ?? 'Ticket inválido');
            scheduleReset();
            return;
          }

          setStatusColor(SUCCESS_COLOR);
          setMessage('Entrada liberada!');
          if (beep) {
            void beep.play().catch(() => {});
          }
          scheduleReset();
        } catch (error: any) {
          setStatusColor(ERROR_COLOR);
          setMessage(error.message ?? 'Falha na validação');
          scheduleReset();
        }
      }, () => {});
    }

    initScanner();

    return () => {
      isCancelled = true;
      lastToken.current = null;
      if (scanner) {
        scanner.clear().catch(() => {});
        scanner.pause(true);
      }
    };
  }, [requestHeaders]);

  return (
    <div className="space-y-6">
      <div id="reader" style={{ width: '100%', maxWidth: 420, margin: '0 auto' }} />
      <div
        className="card"
        style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          fontWeight: 600,
          borderColor: statusColor || 'rgba(148,163,184,0.15)',
          color: statusColor || undefined
        }}
      >
        {message}
      </div>
    </div>
  );
}
