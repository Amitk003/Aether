import { useEffect, useRef, useState } from 'react';
import { getEngine } from '../hooks/useAether';

interface Props {
  active: boolean;
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

function QrScanner({ active, onScan, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [status, setStatus] = useState<string>('initializing');
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (!active) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setStatus('stopped');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setPermission('granted');
        getEngine().setCameraPermission(true);
        startScanner();
      })
      .catch(() => {
        setPermission('denied');
        setStatus('no permission');
        getEngine().setCameraPermission(false);
        onError?.('Camera permission denied');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [active]);

  async function startScanner(): Promise<void> {
    if (!containerRef.current) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          onScan(decodedText);
        },
        () => {}
      );

      setStatus('scanning');
    } catch (err: any) {
      const msg = err?.message || 'Failed to start camera';
      setStatus('error');
      onError?.(msg);
    }
  }

  return (
    <div>
      <div
        id="qr-reader"
        ref={containerRef}
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: active && permission !== 'denied' ? '250px' : 'auto',
        }}
      />
      {permission === 'denied' && (
        <p style={{ color: 'var(--error)', fontSize: '0.85rem', textAlign: 'center', marginTop: '12px' }}>
          Camera access is blocked. Grant camera permission in your browser settings and restart.
        </p>
      )}
      {status === 'scanning' && (
        <p style={{ color: 'var(--success)', fontSize: '0.85rem', textAlign: 'center', marginTop: '12px' }}>
          Scanning for QR codes...
        </p>
      )}
    </div>
  );
}

export default QrScanner;
