'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { FileText, Plus, Search, Edit, Trash2, Archive, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useToast } from '@/store/toastStore';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  autor: string;
  miniatura?: string;
  estado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
  vistas: number;
  publicadoEn?: string;
  createdAt: string;
}

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    fetchPosts();
  }, [filterEstado]);

  const fetchPosts = async () => {
    try {
      const params: any = {};
      if (filterEstado) params.estado = filterEstado;
      
      const response = await axios.get('/cms/blog', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este artículo?')) return;
    
    try {
      await axios.delete(`/cms/blog/${id}`);
      toast.success('Artículo eliminado', 'El artículo ha sido eliminado exitosamente');
      await fetchPosts();
    } catch (error) {
      console.error('Error al eliminar artículo:', error);
      toast.error('Error', 'No se pudo eliminar el artículo');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await axios.patch(`/cms/blog/${id}/archivar`);
      toast.success('Artículo archivado', 'El artículo ha sido archivado');
      await fetchPosts();
    } catch (error) {
      console.error('Error al archivar artículo:', error);
      toast.error('Error', 'No se pudo archivar el artículo');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.autor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const badges = {
      BORRADOR: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      PUBLICADO: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      ARCHIVADO: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    };
    return badges[estado as keyof typeof badges] || badges.BORRADOR;
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              Blog
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona artículos del blog para mejorar el SEO de la tienda
            </p>
          </div>
          <Link
            href="/cms/tienda/blog/crear"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Publicación
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los estados</option>
              <option value="BORRADOR">Borrador</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Cargando artículos...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay artículos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Crea tu primer artículo para comenzar a mejorar el SEO
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Artículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Autor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vistas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.titulo}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {post.descripcion}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{post.autor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(post.estado)}`}>
                          {post.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Eye className="w-4 h-4" />
                          {post.vistas}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {post.publicadoEn 
                            ? new Date(post.publicadoEn).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/cms/tienda/blog/editar/${post.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          {post.estado !== 'ARCHIVADO' && (
                            <button
                              onClick={() => handleArchive(post.id)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="Archivar"
                            >
                              <Archive className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(BlogPage);
