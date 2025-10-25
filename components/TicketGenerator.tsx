'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface ApiTicket {
  serial: number;
  tokenPlain: string;
  eventName: string;
  eventId: string;
}

interface TicketResponse {
  serial: number;
  tokenPlain: string;
  eventName: string;
  eventId: string;
  qrData: string;
  url: string;
}

interface Props {
  events: Array<{ id: string; name: string }>;
  scanBaseUrl: string;
}

export function TicketGenerator({ events, scanBaseUrl }: Props) {
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!events.length) {
      setSelectedEvent('');
      return;
    }

    if (!events.find((event) => event.id === selectedEvent)) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  const scanUrl = useMemo(() => {
    return scanBaseUrl.replace(/\/$/, '');
  }, [scanBaseUrl]);

  async function handleGenerate() {
    if (!selectedEvent) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tickets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId: selectedEvent, quantity })
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Falha ao gerar tickets');
      }
      const payload = await response.json();
      const enriched: TicketResponse[] = await Promise.all(
        (payload.tickets as ApiTicket[]).map(async (ticket) => {
          const url = `${scanUrl}/scan?tok=${ticket.tokenPlain}`;
          const qrData = await QRCode.toDataURL(url, { margin: 1, width: 180 });
          return {
            ...ticket,
            qrData,
            url
          };
        })
      );
      setTickets(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(ticket: TicketResponse) {
    const qrData = await QRCode.toDataURL(ticket.url, { margin: 1, width: 256 });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('Ticket de acesso', {
      x: 40,
      y: 540,
      size: 20,
      font,
      color: rgb(0.2, 0.6, 1)
    });

    page.drawText(`Evento: ${ticket.eventName}`, { x: 40, y: 500, size: 14, font });
    page.drawText(`Número: ${ticket.serial}`, { x: 40, y: 470, size: 14, font });

    const qrImage = await pdfDoc.embedPng(qrData);
    const qrDims = qrImage.scale(0.8);
    page.drawImage(qrImage, {
      x: 40,
      y: 260,
      width: qrDims.width,
      height: qrDims.height
    });

    page.drawText('Apresente este QR Code na entrada.', {
      x: 40,
      y: 240,
      size: 12,
      font
    });

    page.drawText(ticket.url, { x: 40, y: 210, size: 10, font });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `ticket-${ticket.serial}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="space-y-4">
      <div className="grid">
        <label>
          Evento
          <select
            value={selectedEvent}
            onChange={(event) => setSelectedEvent(event.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantidade de tickets
          <input
            type="number"
            min={1}
            max={200}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isNaN(value)) {
                setQuantity(1);
              } else {
                setQuantity(Math.min(200, Math.max(1, value)));
              }
            }}
          />
        </label>
        <button className="button" type="button" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar tickets'}
        </button>
      </div>
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      <div className="grid two">
        {tickets.map((ticket) => {
          return (
            <div key={ticket.serial} className="card">
              <p className="text-sm text-slate-300">Ticket #{ticket.serial}</p>
              <p className="text-base font-semibold mb-2">{ticket.eventName}</p>
              <img
                src={ticket.qrData}
                alt={`QR code do ticket ${ticket.serial}`}
                style={{ width: 160, height: 160, marginBottom: '0.75rem' }}
              />
              <p className="text-xs break-all mb-3">{ticket.url}</p>
              <button className="button" type="button" onClick={() => handleDownload(ticket)}>
                Baixar PDF
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
