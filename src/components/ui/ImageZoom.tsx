'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  onClickExpand?: () => void;
  showExpandIcon?: boolean;
}

const ImageZoom: React.FC<ImageZoomProps> = ({
  src,
  alt,
  onClickExpand,
  showExpandIcon = true,
}) => {
  const [isZooming, setIsZooming] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    // Delay de 1.5 segundos antes de activar el zoom
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZooming(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    // Limpiar el timeout si existe
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }
    setIsZooming(false);
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={imageRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-gray-100 cursor-crosshair group"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClickExpand}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-200"
        style={{
          transform: isZooming ? 'scale(2)' : 'scale(1)',
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Expand Icon */}
      {showExpandIcon && (
        <div className="absolute top-3 right-3 bg-white bg-opacity-80 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Maximize2 size={20} className="text-dark" />
        </div>
      )}

      {/* Zoom Indicator */}
      {isZooming && (
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Zoom 2x
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
