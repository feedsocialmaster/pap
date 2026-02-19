'use client';

import { useMemo } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Send } from 'lucide-react';

export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const shareUrl = useMemo(() => {
    try {
      return encodeURIComponent(url);
    } catch {
      return '';
    }
  }, [url]);

  const shareText = useMemo(() => {
    try {
      return encodeURIComponent(title);
    } catch {
      return '';
    }
  }, [title]);

  const urls = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    }),
    [shareText, shareUrl]
  );

  const open = (platform: keyof typeof urls) => {
    const href = urls[platform];
    if (!href) return;
    window.open(href, '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('¡Enlace copiado al portapapeles!');
    } catch {
      alert('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => open('facebook')}
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        title="Compartir en Facebook"
        aria-label="Compartir en Facebook"
      >
        <Facebook className="w-5 h-5" />
      </button>
      <button
        onClick={() => open('twitter')}
        className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
        title="Compartir en Twitter"
        aria-label="Compartir en Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>
      <button
        onClick={() => open('linkedin')}
        className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
        title="Compartir en LinkedIn"
        aria-label="Compartir en LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </button>
      <button
        onClick={() => open('whatsapp')}
        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        title="Compartir en WhatsApp"
        aria-label="Compartir en WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
      <button
        onClick={() => open('telegram')}
        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        title="Compartir en Telegram"
        aria-label="Compartir en Telegram"
      >
        <Send className="w-5 h-5" />
      </button>

      <button
        onClick={copyLink}
        className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
        title="Copiar enlace"
        aria-label="Copiar enlace"
      >
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  );
}
