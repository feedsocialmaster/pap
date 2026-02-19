'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Send,
  Share2
} from 'lucide-react';
import { 
  SiReddit, 
  SiPinterest 
} from 'react-icons/si';

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productUrl: string;
  productName: string;
  productDescription?: string;
  productImage?: string;
}

export default function ShareProductModal({
  isOpen,
  onClose,
  productUrl,
  productName,
  productDescription = '',
  productImage = '',
}: ShareProductModalProps) {
  const shareUrl = useMemo(() => {
    try {
      return encodeURIComponent(productUrl);
    } catch {
      return '';
    }
  }, [productUrl]);

  const shareText = useMemo(() => {
    try {
      const text = productDescription 
        ? `${productName} - ${productDescription}` 
        : productName;
      return encodeURIComponent(text);
    } catch {
      return encodeURIComponent(productName);
    }
  }, [productName, productDescription]);

  const shareImage = useMemo(() => {
    try {
      return encodeURIComponent(productImage);
    } catch {
      return '';
    }
  }, [productImage]);

  const urls = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
      reddit: `https://reddit.com/submit?url=${shareUrl}&title=${shareText}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareText}&media=${shareImage}`,
    }),
    [shareText, shareUrl, shareImage]
  );

  const open = (platform: keyof typeof urls) => {
    const href = urls[platform];
    if (!href) return;
    
    window.open(href, '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      alert('¡Enlace copiado al portapapeles!');
    } catch {
      alert('No se pudo copiar el enlace');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Compartir Producto
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Comparte "{productName}" en tus redes sociales favoritas
        </p>

        {/* Grid de Redes Sociales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Facebook */}
          <button
            onClick={() => open('facebook')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all transform hover:scale-105"
            title="Compartir en Facebook"
          >
            <div className="p-3 bg-blue-600 text-white rounded-full">
              <Facebook className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Facebook</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={() => open('twitter')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-50 hover:bg-sky-100 transition-all transform hover:scale-105"
            title="Compartir en X (Twitter)"
          >
            <div className="p-3 bg-black text-white rounded-full">
              <Twitter className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">X</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => open('whatsapp')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-all transform hover:scale-105"
            title="Compartir en WhatsApp"
          >
            <div className="p-3 bg-green-500 text-white rounded-full">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => open('telegram')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all transform hover:scale-105"
            title="Compartir en Telegram"
          >
            <div className="p-3 bg-blue-500 text-white rounded-full">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Telegram</span>
          </button>

          {/* Reddit */}
          <button
            onClick={() => open('reddit')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all transform hover:scale-105"
            title="Compartir en Reddit"
          >
            <div className="p-3 bg-orange-600 text-white rounded-full">
              <SiReddit className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Reddit</span>
          </button>

          {/* Pinterest */}
          <button
            onClick={() => open('pinterest')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-all transform hover:scale-105"
            title="Compartir en Pinterest"
          >
            <div className="p-3 bg-red-600 text-white rounded-full">
              <SiPinterest className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700">Pinterest</span>
          </button>
        </div>

        {/* Botón copiar enlace */}
        <div className="border-t pt-4">
          <button
            onClick={copyLink}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <Share2 className="w-5 h-5" />
            Copiar enlace
          </button>
        </div>
      </div>
    </div>
  );
}
