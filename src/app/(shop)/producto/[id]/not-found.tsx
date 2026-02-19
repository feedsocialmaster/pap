import Link from 'next/link';

export default function NotFoundProducto() {
  return (
    <div className="container-custom py-8 mt-8">
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold text-dark mb-4">Producto no encontrado</h1>
        <p className="text-gray mb-8">El producto que buscás no existe o no está disponible.</p>
        <Link href="/tienda" className="text-primary hover:underline">Volver a la tienda</Link>
      </div>
    </div>
  );
}
