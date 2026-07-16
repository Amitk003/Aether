import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  data: string;
  label?: string;
  active?: boolean;
}

function QrDisplay({ data, label, active = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current || !data) return;

    QRCode.toCanvas(canvasRef.current, data, {
      width: 280,
      margin: 2,
      color: {
      dark: '#000000',
      light: '#ffffff',
      },
    }, (err: Error | null | undefined) => {
      if (err) setError(err.message);
    });
  }, [data, active]);

  if (!active || !data) {
    return null;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ borderRadius: '8px', maxWidth: '100%' }} />
      {label && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>
          {label}
        </p>
      )}
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default QrDisplay;
