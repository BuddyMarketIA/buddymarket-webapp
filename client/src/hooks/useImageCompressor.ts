/**
 * useImageCompressor
 * Compresses an image File to a JPEG data URL, ensuring:
 *   - Max dimension: 1200px (width or height)
 *   - Max file size: ~1MB (iterative quality reduction)
 *   - Output format: image/jpeg
 *
 * Usage:
 *   const { compress, compressing } = useImageCompressor();
 *   const { dataUrl, base64, sizeKB } = await compress(file);
 */

import { useState, useCallback } from "react";

export interface CompressResult {
  dataUrl: string;   // full data URL (data:image/jpeg;base64,...)
  base64: string;    // raw base64 without prefix
  sizeKB: number;    // final size in KB
  originalSizeKB: number;
}

const MAX_DIMENSION = 1200;
const TARGET_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.35;
const QUALITY_STEP = 0.08;

function compressCanvas(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): string {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function dataUrlToBytes(dataUrl: string): number {
  // base64 encodes 3 bytes as 4 chars, subtract padding
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = (base64.match(/=+$/) ?? [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function compressImage(file: File): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const originalSizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Error cargando la imagen"));
      img.onload = () => {
        try {
          let quality = INITIAL_QUALITY;
          let dataUrl = compressCanvas(img, MAX_DIMENSION, quality);

          // Iteratively reduce quality until under target size
          while (
            dataUrlToBytes(dataUrl) > TARGET_SIZE_BYTES &&
            quality > MIN_QUALITY
          ) {
            quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
            dataUrl = compressCanvas(img, MAX_DIMENSION, quality);
          }

          const sizeKB = Math.round(dataUrlToBytes(dataUrl) / 1024);
          const base64 = dataUrl.split(",")[1];
          resolve({ dataUrl, base64, sizeKB, originalSizeKB });
        } catch (err) {
          reject(err);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function useImageCompressor() {
  const [compressing, setCompressing] = useState(false);

  const compress = useCallback(async (file: File): Promise<CompressResult> => {
    setCompressing(true);
    try {
      const result = await compressImage(file);
      return result;
    } finally {
      setCompressing(false);
    }
  }, []);

  return { compress, compressing };
}
