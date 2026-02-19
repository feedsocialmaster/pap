import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="container-custom min-h-screen flex items-center justify-center text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6">👠</div>
        <h1 className="text-3xl font-bold text-dark mb-4">
          Producto no encontrado
        </h1>
        <p className="text-gray mb-8">
          Lo sentimos, no pudimos encontrar el producto que buscás.
          Puede que haya sido eliminado o que la dirección sea incorrecta.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/tienda"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <ShoppingBag size={20} />
            Ver productos
          </Link>
          <Link
            href="/"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
