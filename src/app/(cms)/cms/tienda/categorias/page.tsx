'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Search, Tag, Eye, EyeOff } from 'lucide-react';
import axios from '@/lib/axios';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  };
  _count?: {
    products: number;
    primaryProducts: number;
  };
}

function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Category | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [parentId, setParentId] = useState('');
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    cargarCategorias();
  }, [busqueda]);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const params: any = { limite: 100 };
      if (busqueda) params.busqueda = busqueda;

      const response = await axios.get('/cms/categorias', { params });
      setCategorias(response.data.categorias);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      alert(error.response?.data?.error || 'Error al cargar categorías');
    } finally {
      setCargando(false);
    }
  };

  const generarSlug = async () => {
    if (!nombre) return;
    
    try {
      const response = await axios.post('/cms/productos/generar-slug', { nombre });
      setSlug(response.data.suggestedSlug);
    } catch (error) {
      console.error('Error al generar slug:', error);
    }
  };

  const abrirModalCrear = () => {
    setCategoriaEditando(null);
    setNombre('');
    setSlug('');
    setDescripcion('');
    setParentId('');
    setOrden(0);
    setActivo(true);
    setMostrarModal(true);
  };

  const abrirModalEditar = (categoria: Category) => {
    setCategoriaEditando(categoria);
    setNombre(categoria.name);
    setSlug(categoria.slug);
    setDescripcion(categoria.description || '');
    setParentId(categoria.parentId || '');
    setOrden(categoria.orden);
    setActivo(categoria.activo);
    setMostrarModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !slug) {
      alert('Nombre y slug son obligatorios');
      return;
    }

    try {
      setGuardando(true);

      const data = {
        name: nombre,
        slug,
        description: descripcion || undefined,
        parentId: parentId || null,
        orden,
        activo,
      };

      if (categoriaEditando) {
        await axios.put(`/cms/categorias/${categoriaEditando.id}`, data);
      } else {
        await axios.post('/cms/categorias', data);
      }

      setMostrarModal(false);
      await cargarCategorias();
    } catch (error: any) {
      console.error('Error al guardar categoría:', error);
      alert(error.response?.data?.error || 'Error al guardar categoría');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCategoria = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      await axios.delete(`/cms/categorias/${id}`);
      await cargarCategorias();
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      alert(error.response?.data?.error || 'Error al eliminar categoría');
    }
  };

  return (
    <CMSLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">
            Gestión de Categorías
          </h1>
          <p className="text-neutral-400">
            Administra las categorías de productos de la tienda
          </p>
        </div>

        {/* Acciones */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
          </button>
        </div>

        {/* Tabla de categorías */}
        {cargando ? (
          <div className="text-center py-12 text-neutral-400">
            Cargando categorías...
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            No se encontraron categorías
          </div>
        ) : (
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Categoria Padre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-neutral-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium text-neutral-100">
                            {categoria.name}
                          </div>
                          {categoria.description && (
                            <div className="text-xs text-neutral-400">
                              {categoria.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-neutral-300 bg-neutral-900 px-2 py-1 rounded">
                        {categoria.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {categoria.parent ? categoria.parent.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {categoria._count?.products || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categoria.activo
                            ? 'bg-green-900 text-green-300'
                            : 'bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {categoria.activo ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Activa
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Inactiva
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => abrirModalEditar(categoria)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminarCategoria(categoria.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Crear/Editar */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-neutral-100 mb-4">
                {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Slug *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="flex-1 bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={generarSlug}
                      className="bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-4 py-2 rounded-lg transition-colors"
                    >
                      Generar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Categoría Padre
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Sin categoría padre</option>
                    {categorias
                      .filter((c) => c.id !== categoriaEditando?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={orden}
                      onChange={(e) => setOrden(parseInt(e.target.value))}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => setActivo(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-neutral-300">
                        Categoría activa
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-4 py-2 rounded-lg transition-colors"
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(CategoriasPage);
