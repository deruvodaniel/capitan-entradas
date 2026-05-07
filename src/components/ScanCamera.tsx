"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface VerifyResult {
  ok: boolean;
  reason?: string;
  checkedInAt?: string;
  ticket?: {
    code: string;
    buyerName: string;
    tier: string;
    show: string;
    checkedInAt: string;
  };
}

const REASON_LABELS: Record<string, string> = {
  INVALID_SIGNATURE: "QR inválido o falsificado",
  NOT_FOUND: "Entrada no encontrada",
  REVOKED: "Entrada revocada",
  WRONG_SHOW: "Entrada de otro show",
  ALREADY_USED: "Ya fue utilizada",
  VOIDED: "Entrada anulada",
  INVALID_REQUEST: "Error en la solicitud",
};

export default function ScanCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        setResult(null);
        setError("");
        startScanning();
      }
    } catch {
      setError("No se pudo acceder a la cámara");
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(false);
  }

  function startScanning() {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || processing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      try {
        // @ts-expect-error BarcodeDetector is not in all TS libs yet
        if (typeof BarcodeDetector !== "undefined") {
          // @ts-expect-error BarcodeDetector
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            await verifyQr(barcodes[0].rawValue);
          }
        }
      } catch {
        // BarcodeDetector not supported, will use fallback
      }
    }, 500);
  }

  async function verifyQr(qrToken: string) {
    if (processing) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });
      const data: VerifyResult = await res.json();
      setResult(data);
      stopCamera();
    } catch {
      setError("Error de conexión");
    } finally {
      setProcessing(false);
    }
  }

  // Manual input fallback
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Camera view */}
      <div className="relative bg-card border border-card-border rounded-xl overflow-hidden aspect-square max-w-sm mx-auto">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        {!scanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-hover"
            >
              <Camera className="w-5 h-5" />
              Escanear QR
            </button>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[15%] border-2 border-accent rounded-2xl" />
          </div>
        )}
      </div>

      {/* Result display */}
      {result && (
        <div
          className={`p-6 rounded-xl border text-center ${
            result.ok
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {result.ok ? (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-green-400 font-bold text-lg">CHECK-IN OK</p>
              {result.ticket && (
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <strong>{result.ticket.buyerName}</strong>
                  </p>
                  <p className="text-muted">{result.ticket.tier}</p>
                  <p className="text-muted font-mono">{result.ticket.code}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {result.reason === "ALREADY_USED" ? (
                <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
              ) : (
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
              )}
              <p className="text-red-400 font-bold text-lg">
                {REASON_LABELS[result.reason || ""] || result.reason}
              </p>
              {result.checkedInAt && (
                <p className="text-sm text-muted mt-1">
                  Ya ingresó: {new Date(result.checkedInAt).toLocaleString("es-AR")}
                </p>
              )}
            </>
          )}
          <button
            onClick={() => {
              setResult(null);
              startCamera();
            }}
            className="mt-4 bg-card border border-card-border px-4 py-2 rounded-lg text-sm hover:border-muted"
          >
            Escanear otro
          </button>
        </div>
      )}

      {/* Manual fallback */}
      <details className="text-sm">
        <summary className="text-muted cursor-pointer hover:text-foreground">
          Ingresar código manualmente
        </summary>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Pegar contenido del QR"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 px-3 py-2 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => {
              if (manualToken.trim()) verifyQr(manualToken.trim());
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover"
          >
            Verificar
          </button>
        </div>
      </details>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
