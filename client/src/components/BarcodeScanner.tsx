import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import ProductNutritionCard from "./ProductNutritionCard";

interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  nutriScore: string | null;
  novaGroup: number | null;
  per100g: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    fiber?: number;
    sugars?: number;
    saturatedFat?: number;
    salt?: number;
  };
}

interface BarcodeScannerProps {
  onProductFound: (product: ScannedProduct) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Preview state: show product before handing off
  const [preview, setPreview] = useState<ScannedProduct | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasScannedRef = useRef(false);

  const lookupQuery = trpc.mealLogs.lookupBarcode.useQuery(
    { barcode: scannedCode ?? "" },
    { enabled: !!scannedCode, retry: false }
  );

  // When product data arrives, show preview
  useEffect(() => {
    if (lookupQuery.data) {
      setPreview(lookupQuery.data as ScannedProduct);
    }
  }, [lookupQuery.data]);

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      try { codeReaderRef.current.reset(); } catch {}
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setCameraError(null);
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      codeReader.decodeFromStream(stream, videoRef.current, (result) => {
        if (result && !hasScannedRef.current) {
          hasScannedRef.current = true;
          const code = result.getText();
          stopCamera();
          setScanning(false);
          setScannedCode(code);
        }
      });
    } catch (err: any) {
      setScanning(false);
      if (err?.name === "NotAllowedError") {
        setCameraError("Permiso de cámara denegado. Usa la entrada manual.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No se encontró cámara. Usa la entrada manual.");
      } else {
        setCameraError("Error al acceder a la cámara. Usa la entrada manual.");
      }
    }
  }, [stopCamera]);

  // Handle lookup error
  useEffect(() => {
    if (lookupQuery.error) {
      toast.error("Producto no encontrado en la base de datos.");
      hasScannedRef.current = false;
      setScannedCode(null);
      if (mode === "camera") {
        setTimeout(() => startCamera(), 300);
      }
    }
  }, [lookupQuery.error, mode, startCamera]);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
      setScanning(false);
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const handleManualSearch = () => {
    const code = manualCode.trim();
    if (code.length < 4) {
      toast.error("Introduce al menos 4 dígitos");
      return;
    }
    setScannedCode(code);
  };

  const handleConfirm = () => {
    if (preview) {
      onProductFound(preview);
    }
  };

  const handleScanAgain = () => {
    setPreview(null);
    setScannedCode(null);
    hasScannedRef.current = false;
    setManualCode("");
    if (mode === "camera") {
      setTimeout(() => startCamera(), 100);
    }
  };

  const isLoading = lookupQuery.isFetching;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { stopCamera(); onClose(); } }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "460px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #F97316, #FB923C)",
            padding: "18px 20px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "white" }}>
              {preview ? "🥗 Información Nutricional" : "📷 Escáner de Productos"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
              {preview
                ? "Revisa los valores antes de añadir"
                : "Escanea el código de barras del producto"}
            </p>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "white",
              fontSize: "18px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* ── PREVIEW STATE: full nutrition card ── */}
        {preview && (
          <div style={{ padding: "20px 20px 24px" }}>
            <ProductNutritionCard
              name={preview.name}
              brand={preview.brand}
              quantity={preview.quantity}
              imageUrl={preview.imageUrl}
              nutriScore={preview.nutriScore}
              novaGroup={preview.novaGroup}
              per100g={preview.per100g}
              compact
            />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={handleScanAgain}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                🔄 Escanear otro
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: "linear-gradient(135deg, #F97316, #FB923C)",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                }}
              >
                ✓ Usar este producto
              </button>
            </div>
          </div>
        )}

        {/* ── SCAN / SEARCH STATE ── */}
        {!preview && (
          <>
            {/* Mode tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
              {(["camera", "manual"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setScannedCode(null); setManualCode(""); hasScannedRef.current = false; }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    background: "none",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    color: mode === m ? "#F97316" : "#6B7280",
                    borderBottom: mode === m ? "2px solid #F97316" : "2px solid transparent",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "camera" ? "📷 Cámara" : "⌨️ Manual"}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px 20px 24px" }}>
              {/* Loading state */}
              {isLoading && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔍</div>
                  <p style={{ margin: 0, fontWeight: 800, color: "#1F2937", fontSize: 16 }}>Buscando producto...</p>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6B7280" }}>Consultando Open Food Facts</p>
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#F97316",
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Camera mode */}
              {!isLoading && mode === "camera" && (
                <div>
                  {cameraError ? (
                    <div
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "14px", color: "#DC2626", fontWeight: 600 }}>⚠️ {cameraError}</p>
                      <button
                        onClick={() => setMode("manual")}
                        style={{
                          marginTop: "10px",
                          background: "#F97316",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Usar entrada manual
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "#000",
                        aspectRatio: "4/3",
                        marginBottom: "16px",
                      }}
                    >
                      <video
                        ref={videoRef}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        playsInline
                        muted
                      />
                      {/* Scanning overlay */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            width: "220px",
                            height: "130px",
                            border: "3px solid #F97316",
                            borderRadius: "12px",
                            boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)",
                            position: "relative",
                          }}
                        >
                          {/* Corner accents */}
                          {[
                            { top: -3, left: -3, borderTop: "4px solid #fff", borderLeft: "4px solid #fff" },
                            { top: -3, right: -3, borderTop: "4px solid #fff", borderRight: "4px solid #fff" },
                            { bottom: -3, left: -3, borderBottom: "4px solid #fff", borderLeft: "4px solid #fff" },
                            { bottom: -3, right: -3, borderBottom: "4px solid #fff", borderRight: "4px solid #fff" },
                          ].map((s, i) => (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                width: 20,
                                height: 20,
                                borderRadius: 2,
                                ...s,
                              }}
                            />
                          ))}
                          {/* Animated scan line */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: 4,
                              right: 4,
                              height: "2px",
                              background: "linear-gradient(90deg, transparent, #F97316, transparent)",
                              animation: "scanLine 1.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                      </div>
                      {scanning && (
                        <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, textAlign: "center" }}>
                          <span
                            style={{
                              background: "rgba(0,0,0,0.65)",
                              color: "white",
                              fontSize: "13px",
                              fontWeight: 700,
                              padding: "5px 14px",
                              borderRadius: "20px",
                            }}
                          >
                            📷 Apunta al código de barras
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual mode */}
              {!isLoading && mode === "manual" && (
                <div>
                  <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#6B7280" }}>
                    Introduce el código EAN/UPC del producto (el número bajo el código de barras):
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                      placeholder="Ej: 3017620422003"
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        border: "2px solid #E5E7EB",
                        borderRadius: "12px",
                        fontSize: "15px",
                        fontWeight: 600,
                        outline: "none",
                        fontFamily: "monospace",
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleManualSearch}
                      disabled={manualCode.trim().length < 4}
                      style={{
                        background: manualCode.trim().length >= 4 ? "#F97316" : "#E5E7EB",
                        color: manualCode.trim().length >= 4 ? "white" : "#9CA3AF",
                        border: "none",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: manualCode.trim().length >= 4 ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                      }}
                    >
                      Buscar
                    </button>
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#9CA3AF" }}>
                    💡 Más de 3 millones de productos en Open Food Facts
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-30px); opacity: 0.3; }
          50% { transform: translateY(30px); opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
