import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

export default function SignaturePad({
  value = '',
  onChange,
  label = 'Firma digital',
  readOnly = false,
  required = false
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [lastPoint, setLastPoint] = useState(null);

  // Redimensionar canvas manteniendo el trazo
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 140;

    // Guardar imagen actual antes de redimensionar
    let currentImage = null;
    if (hasSignature) {
      currentImage = canvas.toDataURL();
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;

    // Restaurar trazo
    const imgToLoad = currentImage || value;
    if (imgToLoad) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasSignature(true);
      };
      img.src = imgToLoad;
    }
  }, [value, hasSignature]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Si cambia el valor externo (e.g., reset o cambio de nota)
  useEffect(() => {
    if (!value) {
      handleClear(false);
    } else {
      setHasSignature(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          const rect = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = value;
      }
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint(coords);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || readOnly || !lastPoint) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentCoords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentCoords.x, currentCoords.y);
    ctx.stroke();

    setLastPoint(currentCoords);
    setHasSignature(true);
  };

  const handlePointerUp = (e) => {
    if (!isDrawing || readOnly) return;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
    setIsDrawing(false);
    setLastPoint(null);

    // Notificar al padre con el dataURL
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onChange?.(dataUrl);
    }
  };

  const handleClear = (notify = true) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasSignature(false);
    if (notify) {
      onChange?.('');
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <PenTool size={13} className="text-lime-600" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {!readOnly && hasSignature && (
          <button
            type="button"
            onClick={() => handleClear(true)}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-red-50"
          >
            <Eraser size={12} />
            Borrar firma
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative border-2 rounded-xl bg-white overflow-hidden transition-all touch-none select-none ${
          readOnly
            ? 'border-gray-200 bg-gray-50'
            : isDrawing
            ? 'border-lime-500 ring-2 ring-lime-200'
            : hasSignature
            ? 'border-emerald-300'
            : 'border-dashed border-gray-300 hover:border-gray-400'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full block ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
          style={{ height: '140px' }}
        />

        {/* Línea guía de firma */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-gray-200 pointer-events-none flex justify-end">
          <span className="text-[10px] text-gray-300 uppercase tracking-widest font-mono">
            {hasSignature ? 'Firma capturada' : 'Firme aquí con el dedo o ratón'}
          </span>
        </div>

        {hasSignature && (
          <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200 pointer-events-none">
            <Check size={11} />
            Listo
          </div>
        )}
      </div>
    </div>
  );
}
