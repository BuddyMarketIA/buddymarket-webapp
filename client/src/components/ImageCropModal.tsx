import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = 400; // output size 400x400
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Draw circular clip
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((c: Point) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);
  const onCropCompleteCallback = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (e) {
      console.error("Error cropping image:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      {/* Modal card */}
      <div style={{
        background: "#FFFFFF", borderRadius: "24px", width: "100%", maxWidth: "420px",
        overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", textAlign: "center" }}>
            Ajustar foto de perfil
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
            Mueve y ajusta el zoom para encuadrar tu foto
          </p>
        </div>

        {/* Cropper area */}
        <div style={{ position: "relative", width: "100%", height: "320px", background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "3px solid #F97316",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: "16px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#F97316", height: "4px", cursor: "pointer" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
            </svg>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: "12px 20px 20px", display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              flex: 1, padding: "13px", borderRadius: "14px", border: "1.5px solid rgba(0,0,0,0.1)",
              background: "transparent", fontSize: "15px", fontWeight: 700, color: "#374151",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              flex: 1, padding: "13px", borderRadius: "14px", border: "none",
              background: isProcessing ? "#fbd5b5" : "linear-gradient(135deg, #F97316, #FB923C)",
              fontSize: "15px", fontWeight: 800, color: "white",
              cursor: isProcessing ? "not-allowed" : "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {isProcessing ? (
              <>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2.5px solid white", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                Procesando...
              </>
            ) : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
