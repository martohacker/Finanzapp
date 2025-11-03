import { useState, useEffect } from 'react';
import { Estadisticas as EstadisticasType } from '../types';
import { Moneda } from '../constants/monedas';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { formatearMonto } from '../utils/formato';
import { DollarSign, RefreshCw, AlertCircle } from 'lucide-react';

interface ResumenConversionProps {
  estadisticas: EstadisticasType;
  monedaActual: Moneda;
  monedaDestino?: Moneda; // Por defecto ARS
}

export function ResumenConversion({
  estadisticas,
  monedaActual,
  monedaDestino
}: ResumenConversionProps) {
  const [conversiones, setConversiones] = useState<{
    total?: number;
    mes?: number;
    dia?: number;
  }>({});
  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  const destino = monedaDestino || { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', locale: 'es-AR' };
  const { convertirDirecto, actualizarCotizaciones, cargando: cargandoCotizaciones } = useCotizaciones(
    monedaActual.codigo,
    destino.codigo
  );

  useEffect(() => {
    const calcularConversiones = async () => {
      if (monedaActual.codigo === destino.codigo) {
        setConversiones({
          total: estadisticas.totalGastos,
          mes: estadisticas.gastoDelMes,
          dia: estadisticas.gastoDelDia,
        });
        setTasaCambio(1);
        return;
      }

      setCargando(true);
      try {
        // Calcular tasa de cambio
        const tasa = await convertirDirecto(1, monedaActual.codigo, destino.codigo);
        setTasaCambio(tasa);

        // Convertir todos los montos
        const total = await convertirDirecto(estadisticas.totalGastos, monedaActual.codigo, destino.codigo);
        const mes = await convertirDirecto(estadisticas.gastoDelMes, monedaActual.codigo, destino.codigo);
        const dia = await convertirDirecto(estadisticas.gastoDelDia, monedaActual.codigo, destino.codigo);

        setConversiones({ total, mes, dia });
      } catch (error) {
        console.error('Error al convertir:', error);
      } finally {
        setCargando(false);
      }
    };

    calcularConversiones();
  }, [
    estadisticas.totalGastos,
    estadisticas.gastoDelMes,
    estadisticas.gastoDelDia,
    monedaActual.codigo,
    destino.codigo,
    convertirDirecto
  ]);

  if (monedaActual.codigo === destino.codigo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-green-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DollarSign className="text-green-600 flex-shrink-0" size={20} />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
            Conversión a {destino.nombre}
          </h3>
        </div>
        <button
          onClick={actualizarCotizaciones}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
          disabled={cargando || cargandoCotizaciones}
          title="Actualizar cotizaciones"
        >
          <RefreshCw 
            size={18} 
            className={cargando || cargandoCotizaciones ? 'animate-spin' : ''} 
          />
        </button>
      </div>

      {tasaCambio && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Tipo de cambio: <span className="font-semibold">1 {monedaActual.codigo} = {tasaCambio.toFixed(4)} {destino.codigo}</span>
          </p>
        </div>
      )}

      {cargando || cargandoCotizaciones ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="text-green-600 animate-spin" size={24} />
          <span className="ml-2 text-gray-600">Obteniendo cotizaciones...</span>
        </div>
      ) : conversiones.total !== undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total de Gastos</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatearMonto(conversiones.total, destino, 0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Gasto del Mes</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatearMonto(conversiones.mes || 0, destino, 0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Gasto del Día</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatearMonto(conversiones.dia || 0, destino, 0)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-8 text-orange-600">
          <AlertCircle size={20} />
          <span>No se pudieron obtener las cotizaciones</span>
        </div>
      )}
    </div>
  );
}
