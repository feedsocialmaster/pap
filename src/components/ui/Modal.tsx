"use client";

import React from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string; // e.g., max-w-lg
}

export default function Modal({ open, title, onClose, footer, children, widthClassName = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl p-6 w-full ${widthClassName}`} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
        <div>{children}</div>
        {footer && <div className="mt-6 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
