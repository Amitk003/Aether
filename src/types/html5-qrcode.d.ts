declare module 'html5-qrcode' {
  interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number };
  }

  class Html5Qrcode {
    constructor(elementId: string);
    start(
      camera: { facingMode: string },
      config: Html5QrcodeConfig,
      onSuccess: (text: string) => void,
      onFailure: (err: any) => void
    ): Promise<void>;
    stop(): Promise<void>;
  }

  export { Html5Qrcode };
}
