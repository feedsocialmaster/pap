'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import axios from '@/lib/axios';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { ColorPicker } from '@/components/cms/ColorPicker';
import { ProductVariantsEditor, ProductVariant } from '@/components/cms/ProductVariantsEditor';

interface ImagenProducto {
  url: string;
  alt?: string;
  file?: File;
}

function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const productoId = params.id as string;
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipoCalzado, setTipoCalzado] = useState('ZAPATILLAS');
  const [imagenes, setImagenes] = useState<ImagenProducto[]>([]);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [talles, setTalles] = useState<number[]>([]);
  const [nuevoTalle, setNuevoTalle] = useState('');
  const [colores, setColores] = useState<string[]>([]); // Hex color codes
  const [variants, setVariants] = useState<ProductVariant[]>([]); // Variantes con stock por color
  const [enLiquidacion, setEnLiquidacion] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('');
  const [esFiesta, setEsFiesta] = useState(false);
  const [impermeable, setImpermeable] = useState(false);
  const [antideslizante, setAntideslizante] = useState(false);
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState('');
  
  // Opciones de disponibilidad
  const [retiroEnLocal, setRetiroEnLocal] = useState(false);
  const [envioNacional, setEnvioNacional] = useState(false);
  const [envioLocal, setEnvioLocal] = useState(false);
  const [productoEnLanzamiento, setProductoEnLanzamiento] = useState(false);

  // Métodos de pago
  const [tarjetasSeleccionadas, setTarjetasSeleccionadas] = useState<string[]>([]);
  const [otraTarjeta, setOtraTarjeta] = useState('');
  const [transferenciaBancaria, setTransferenciaBancaria] = useState(false);
  const [mercadoPago, setMercadoPago] = useState(false);
  const [otrosMetodosPago, setOtrosMetodosPago] = useState<string[]>([]);
  const [nuevoMetodoPago, setNuevoMetodoPago] = useState('');

  // Promociones
  const [aplicaPromocion, setAplicaPromocion] = useState(false);
  const [tipoPromocionAplica, setTipoPromocionAplica] = useState('');
  const [promocionesDisponibles, setPromocionesDisponibles] = useState<Array<{id: string, titulo: string, tipoDescuento: string}>>([]);

  const tiposCalzado = [
    'Zapatillas',
    'Botas',
    'Sandalias',
    'Stilettos',
    'Chatitas',
    'Plataformas',
  ];

  /**
   * Limpia un precio en formato argentino y lo convierte a número decimal en PESOS.
   * NO multiplica por 100 - el backend se encarga de convertir a centavos.
   * Acepta: "74500", "74.500", "74.500,50", "1.234.567,89"
   * Formato argentino: punto = miles, coma = decimal
   * Retorna: número decimal en pesos (ej: 74500.50)
   */
  const limpiarPrecio = (precioStr: string): number => {
    if (!precioStr || precioStr.trim() === '') return 0;
    
    // Remover espacios y símbolo de moneda
    let limpio = precioStr.replace(/[\s$]/g, '');
    
    // Detectar si usa formato argentino (punto=miles, coma=decimal)
    // o formato inglés (coma=miles, punto=decimal)
    const tieneComa = limpio.includes(',');
    const tienePunto = limpio.includes('.');
    
    if (tieneComa && tienePunto) {
      // Tiene ambos: determinar cuál viene primero
      const posComa = limpio.indexOf(',');
      const posPunto = limpio.indexOf('.');
      
      if (posPunto < posComa) {
        // Formato argentino: 1.234,56 (punto antes de coma)
        limpio = limpio.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato inglés: 1,234.56 (coma antes de punto)
        limpio = limpio.replace(/,/g, '');
      }
    } else if (tieneComa) {
      // Solo coma: formato argentino (decimal)
      limpio = limpio.replace(',', '.');
    } else if (tienePunto) {
      // Solo punto: verificar si es miles o decimal
      const partes = limpio.split('.');
      if (partes.length === 2) {
        const decimales = partes[1];
        // Si tiene exactamente 3 dígitos después del punto, probablemente es separador de miles
        if (decimales.length === 3 && !decimales.match(/[1-9]0$/)) {
          // Es separador de miles (ej: 74.500)
          limpio = partes.join('');
        }
        // Si tiene 1 o 2 dígitos, es decimal (ej: 74.5 o 74.50)
      } else if (partes.length > 2) {
        // Múltiples puntos: todos son separadores de miles (ej: 1.234.567)
        limpio = partes.join('');
      }
    }
    
    return parseFloat(limpio) || 0;
  };

  useEffect(() => {
    cargarProducto();
  }, [productoId]);

  useEffect(() => {
    // Cargar promociones disponibles
    const cargarPromociones = async () => {
      try {
        const response = await axios.get('/cms/promociones', {
          params: { activo: 'true' }
        });
        setPromocionesDisponibles(response.data.promociones || []);
      } catch (error) {
        console.error('Error al cargar promociones:', error);
      }
    };
    cargarPromociones();
  }, []);

  const cargarProducto = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`/cms/productos/${productoId}`);
      const producto = response.data;

      setNombre(producto.nombre);
      setDescripcion(producto.descripcion);
      setPrecio((producto.precio / 100).toFixed(2));
      setTipoCalzado(producto.tipoCalzado);
      setImagenes(producto.imagenes || []);
      setTalles(producto.talles || []);
      setColores(Array.isArray(producto.colores) ? producto.colores : []);
      
      // Cargar variantes desde la BD - NO agrupar, pasar directamente
      if (producto.variants && Array.isArray(producto.variants) && producto.variants.length > 0) {
        const loadedVariants: ProductVariant[] = producto.variants.map((v: any) => ({
          id: v.id,
          colorName: v.colorName,
          colorCode: v.colorCode,
          size: parseInt(v.size) || v.size, // Asegurar que size es número
          stock: v.stock || 0,
          sku: v.sku || '',
        }));
        setVariants(loadedVariants);
      }
      
      setEnLiquidacion(producto.enLiquidacion);
      setPorcentajeDescuento(producto.porcentajeDescuento ? producto.porcentajeDescuento.toString() : '');
      setEsFiesta(producto.esFiesta);
      setImpermeable(producto.impermeable);
      setAntideslizante(producto.antideslizante);
      setCaracteristicas(producto.caracteristicas || []);
      
      // Cargar opciones de disponibilidad
      setRetiroEnLocal(producto.retiroEnLocal || false);
      setEnvioNacional(producto.envioNacional || false);
      setEnvioLocal(producto.envioLocal || false);
      setProductoEnLanzamiento(producto.productoEnLanzamiento || false);
      
      // Cargar métodos de pago
      if (producto.metodosPago) {
        setTarjetasSeleccionadas(producto.metodosPago.tarjetas || []);
        setTransferenciaBancaria(producto.metodosPago.transferenciaBancaria || false);
        setMercadoPago(producto.metodosPago.mercadoPago || false);
        setOtrosMetodosPago(producto.metodosPago.otros || []);
      }

      // Cargar promociones
      setAplicaPromocion(producto.aplicaPromocion || false);
      setTipoPromocionAplica(producto.tipoPromocionAplica || '');
    } catch (error) {
      console.error('Error al cargar producto:', error);
      alert('Error al cargar el producto');
      router.push('/cms/tienda/productos');
    } finally {
      setCargando(false);
    }
  };

  const handleImagenesSeleccionadas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar que no se exceda el máximo de 8 imágenes
    if (imagenes.length + files.length > 8) {
      alert(`Máximo 8 imágenes permitidas. Actualmente tienes ${imagenes.length} imagen(es).`);
      return;
    }

    // Validar formatos
    const formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/webp'];
    const archivosArray = Array.from(files);
    const archivosInvalidos = archivosArray.filter(
      file => !formatosPermitidos.includes(file.type)
    );

    if (archivosInvalidos.length > 0) {
      alert('Solo se permiten imágenes en formato JPG, JPEG o WEBP');
      return;
    }

    try {
      setSubiendoImagenes(true);

      // Crear FormData para subir las imágenes
      const formData = new FormData();
      archivosArray.forEach(file => {
        formData.append('images', file);
      });

      // Subir imágenes al servidor
      const response = await axios.post('/uploads/productos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Agregar las URLs de las imágenes subidas
      const nuevasImagenes = response.data.data.urls.map((item: any) => ({
        url: item.url,
        alt: nombre || 'Producto',
      }));

      setImagenes([...imagenes, ...nuevasImagenes]);
      
      // Limpiar el input
      e.target.value = '';
    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      alert(error.response?.data?.error || 'Error al subir las imágenes');
    } finally {
      setSubiendoImagenes(false);
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const agregarTalle = () => {
    const talle = parseInt(nuevoTalle);
    if (!isNaN(talle) && talle > 0 && !talles.includes(talle)) {
      setTalles([...talles, talle].sort((a, b) => a - b));
      setNuevoTalle('');
    }
  };

  const eliminarTalle = (talle: number) => {
    setTalles(talles.filter((t) => t !== talle));
  };

  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim() && !caracteristicas.includes(nuevaCaracteristica.trim())) {
      setCaracteristicas([...caracteristicas, nuevaCaracteristica.trim()]);
      setNuevaCaracteristica('');
    }
  };

  const eliminarCaracteristica = (caracteristica: string) => {
    setCaracteristicas(caracteristicas.filter((c) => c !== caracteristica));
  };

  // Funciones para métodos de pago
  const toggleTarjeta = (tarjeta: string) => {
    setTarjetasSeleccionadas(prev =>
      prev.includes(tarjeta)
        ? prev.filter(t => t !== tarjeta)
        : [...prev, tarjeta]
    );
  };

  const agregarOtraTarjeta = () => {
    if (otraTarjeta.trim() && !tarjetasSeleccionadas.includes(otraTarjeta.trim())) {
      setTarjetasSeleccionadas([...tarjetasSeleccionadas, otraTarjeta.trim()]);
      setOtraTarjeta('');
    }
  };

  const agregarMetodoPago = () => {
    if (nuevoMetodoPago.trim() && !otrosMetodosPago.includes(nuevoMetodoPago.trim())) {
      setOtrosMetodosPago([...otrosMetodosPago, nuevoMetodoPago.trim()]);
      setNuevoMetodoPago('');
    }
  };

  const eliminarMetodoPago = (metodo: string) => {
    setOtrosMetodosPago(otrosMetodosPago.filter(m => m !== metodo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !descripcion || !precio || !tipoCalzado) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (limpiarPrecio(precio) <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    if (imagenes.length === 0) {
      alert('Debes tener al menos una imagen');
      return;
    }

    if (imagenes.length > 8) {
      alert('Máximo 8 imágenes permitidas');
      return;
    }

    if (enLiquidacion) {
      const descuento = parseInt(porcentajeDescuento);
      if (isNaN(descuento) || descuento < 1 || descuento > 100) {
        alert('El descuento debe estar entre 1% y 100%');
        return;
      }
    }

    try {
      setGuardando(true);

      const data: any = {
        nombre,
        descripcion,
        precio: limpiarPrecio(precio), // Enviar en pesos, el backend convierte a centavos
        tipoCalzado,
        imagenes,
        talles,
        colores: colores.length > 0 ? colores : null,
        variants, // Variantes con stock por color
        enLiquidacion,
        porcentajeDescuento: enLiquidacion && porcentajeDescuento ? parseInt(porcentajeDescuento) : null,
        esFiesta,
        impermeable,
        antideslizante,
        caracteristicas,
        // Opciones de disponibilidad
        retiroEnLocal,
        envioNacional,
        envioLocal,
        productoEnLanzamiento,
        // Métodos de pago
        metodosPago: {
          tarjetas: tarjetasSeleccionadas,
          transferenciaBancaria,
          mercadoPago,
          otros: otrosMetodosPago,
        },
        // Promociones
        aplicaPromocion,
        tipoPromocionAplica: aplicaPromocion ? tipoPromocionAplica : null,
      };

      await axios.put(`/cms/productos/${productoId}`, data);
      
      alert('✅ Producto actualizado correctamente');
      router.push('/cms/tienda/productos');
    } catch (error: any) {
      console.error('Error al actualizar producto:', error);
      alert(error.response?.data?.error || 'Error al actualizar producto');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Cargando producto...</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/cms/tienda/productos"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar Producto
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-14">
              Modifica los datos del producto
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Información Básica
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio (ARS) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: 98000 o 98.000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ingresa sin puntos (98000) o con formato argentino (98.000)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Calzado *
                  </label>
                  <select
                    value={tipoCalzado}
                    onChange={(e) => setTipoCalzado(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  >
                    {tiposCalzado.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opciones de Disponibilidad */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Opciones de Disponibilidad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={retiroEnLocal}
                      onChange={(e) => setRetiroEnLocal(e.target.checked)}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Retiro en Local
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={envioNacional}
                      onChange={(e) => setEnvioNacional(e.target.checked)}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Envío Nacional
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={envioLocal}
                      onChange={(e) => setEnvioLocal(e.target.checked)}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Envío Local
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={productoEnLanzamiento}
                      onChange={(e) => setProductoEnLanzamiento(e.target.checked)}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Producto en Lanzamiento
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Métodos de Pago
            </h2>

            <div className="space-y-6">
              {/* Tarjetas de Crédito/Débito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tarjeta de Crédito/Débito
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tarjetasSeleccionadas.includes('Visa')}
                      onChange={() => toggleTarjeta('Visa')}
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Visa</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tarjetasSeleccionadas.includes('Mastercard')}
                      onChange={() => toggleTarjeta('Mastercard')}
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mastercard</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tarjetasSeleccionadas.includes('American Express')}
                      onChange={() => toggleTarjeta('American Express')}
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">American Express</span>
                  </label>
                  
                  {/* Agregar otra tarjeta */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={otraTarjeta}
                      onChange={(e) => setOtraTarjeta(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarOtraTarjeta())}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="Agregar otra tarjeta..."
                    />
                    <button
                      type="button"
                      onClick={agregarOtraTarjeta}
                      className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Mostrar tarjetas personalizadas */}
                  {tarjetasSeleccionadas.filter(t => !['Visa', 'Mastercard', 'American Express'].includes(t)).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {tarjetasSeleccionadas
                        .filter(t => !['Visa', 'Mastercard', 'American Express'].includes(t))
                        .map((tarjeta, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">{tarjeta}</span>
                            <button
                              type="button"
                              onClick={() => setTarjetasSeleccionadas(tarjetasSeleccionadas.filter(t => t !== tarjeta))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transferencia Bancaria */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferenciaBancaria}
                    onChange={(e) => setTransferenciaBancaria(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transferencia Bancaria
                  </span>
                </label>
              </div>

              {/* Mercado Pago */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mercadoPago}
                    onChange={(e) => setMercadoPago(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mercado Pago
                  </span>
                </label>
              </div>

              {/* Agregar Métodos de Pago Personalizados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agregar Métodos de Pago
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoMetodoPago}
                    onChange={(e) => setNuevoMetodoPago(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarMetodoPago())}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Efectivo, Crypto, etc."
                  />
                  <button
                    type="button"
                    onClick={agregarMetodoPago}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Agregar
                  </button>
                </div>

                {/* Mostrar métodos de pago personalizados */}
                {otrosMetodosPago.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {otrosMetodosPago.map((metodo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">{metodo}</span>
                        <button
                          type="button"
                          onClick={() => eliminarMetodoPago(metodo)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Liquidación */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Liquidación
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enLiquidacion}
                  onChange={(e) => {
                    setEnLiquidacion(e.target.checked);
                    if (!e.target.checked) {
                      setPorcentajeDescuento('');
                    }
                  }}
                  className="w-5 h-5 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Producto en liquidación
                </span>
              </label>

              {enLiquidacion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Porcentaje de Descuento (1-100%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={porcentajeDescuento || 10}
                      onChange={(e) => setPorcentajeDescuento(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={porcentajeDescuento}
                      onChange={(e) => setPorcentajeDescuento(e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center dark:bg-gray-700 dark:text-white"
                    />
                    <span className="text-gray-600 dark:text-gray-400">%</span>
                  </div>

                  {porcentajeDescuento && precio && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Precio original:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(parseFloat(precio))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Precio final:</span>
                        <span className="text-xl font-bold text-red-600">
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
                            parseFloat(precio) - (parseFloat(precio) * parseInt(porcentajeDescuento) / 100)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Promociones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Promociones (Opcional)
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicaPromocion}
                  onChange={(e) => {
                    setAplicaPromocion(e.target.checked);
                    if (!e.target.checked) {
                      setTipoPromocionAplica('');
                    }
                  }}
                  className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Este producto aplica para promoción
                </span>
              </label>

              {aplicaPromocion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Promoción *
                  </label>
                  <select
                    value={tipoPromocionAplica}
                    onChange={(e) => setTipoPromocionAplica(e.target.value)}
                    required={aplicaPromocion}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {promocionesDisponibles.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.titulo} ({promo.tipoDescuento === 'PORCENTAJE' ? 'Descuento %' : '2x1'})
                      </option>
                    ))}
                  </select>

                  {tipoPromocionAplica && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        ✓ Este producto participará en la promoción seleccionada. 
                        La etiqueta de promoción se mostrará en la ficha del producto y el descuento se aplicará automáticamente en el carrito.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Imágenes del Producto
            </h2>

            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="imagenes-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {subiendoImagenes ? 'Subiendo...' : 'Seleccionar Imágenes'}
                </label>
                <input
                  id="imagenes-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleImagenesSeleccionadas}
                  disabled={subiendoImagenes || imagenes.length >= 8}
                  className="hidden"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Formatos: JPG, JPEG, WEBP. Mínimo 1 imagen, máximo 8 imágenes. 
                  {imagenes.length > 0 && ` (${imagenes.length}/8)`}
                </p>
              </div>

              {imagenes.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagenes.map((imagen, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <Image
                          src={imagen.url}
                          alt={imagen.alt || `Imagen ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarImagen(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Talles Disponibles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Talles Disponibles
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Talles
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  min="1"
                  value={nuevoTalle}
                  onChange={(e) => setNuevoTalle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarTalle())}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: 38"
                />
                <button
                  type="button"
                  onClick={agregarTalle}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {talles.map((talle) => (
                  <span
                    key={talle}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                  >
                    {talle}
                    <button
                      type="button"
                      onClick={() => eliminarTalle(talle)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Colores del Producto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Colores del Producto
            </h2>
            
            <ColorPicker
              colors={colores}
              onChange={setColores}
              required={true}
              maxColors={10}
            />
          </div>

          {/* Stock por Color y Talle */}
          {colores.length > 0 && talles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Stock por Color y Talle
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Gestiona el stock para cada combinación de color y talle
              </p>
              
              <ProductVariantsEditor
                variants={variants}
                onChange={setVariants}
                availableColors={colores}
                availableSizes={talles}
              />
            </div>
          )}

          {/* Características */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Características
            </h2>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esFiesta}
                    onChange={(e) => setEsFiesta(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Calzado de Fiesta
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={impermeable}
                    onChange={(e) => setImpermeable(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Impermeable
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antideslizante}
                    onChange={(e) => setAntideslizante(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Suela Antideslizante
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Características Adicionales
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={nuevaCaracteristica}
                    onChange={(e) => setNuevaCaracteristica(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarCaracteristica())}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Horma ancha, Cierre con velcro, etc."
                  />
                  <button
                    type="button"
                    onClick={agregarCaracteristica}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {caracteristicas.map((caracteristica, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {caracteristica}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarCaracteristica(caracteristica)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Link
              href="/cms/tienda/productos"
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(EditarProductoPage);
