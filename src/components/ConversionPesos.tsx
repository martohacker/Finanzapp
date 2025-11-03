import { useState, useEffect } from 'react';
import { Moneda } from '../constants/monedas';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { formatearMonto } from '../utils/formato';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface ConversionPesosProps {
  monto: number;
  monedaOrigen: Moneda;
  monedaDestino?: Moneda; // Por defecto ARS
}

export function ConversionPesos({ 
  monto, 
  monedaOrigen,
  monedaDestino 
}: ConversionPesosProps) {
  const [montoConvertido, setMontoConvertido] = useState<number | null>(null);
  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  const destino = monedaDestino || { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', locale: 'es-AR' };
  const { convertirDirecto, actualizarCotizaciones, cargando: cargandoCotizaciones } = useCotizaciones(
    monedaOrigen.codigo,
    destino.codigo
  );

  useEffect(() => {
    const calcularConversion = async () => {
      if (monedaOrigen.codigo === destino.codigo) {
        setMontoConvertido(monto);
        setTasaCambio(1);
        return;
      }

      setCargando(true);
      try {
        const resultado = await convertirDirecto(monto, monedaOrigen.codigo, destino.codigo);
        setMontoConvertido(resultado);
        
        // Calcular tasa de cambio
        const tasa = await convertirDirecto(1, monedaOrigen.codigo, destino.codigo);
        setTasaCambio(tasa);
      } catch (error) {
        console.error('Error al convertir:', error);
      } finally {
        setCargando(false);
      }
    };

    calcularConversion();
  }, [monto, monedaOrigen.codigo, destino.codigo, convertirDirecto]);

  if (monedaOrigen.codigo === destino.codigo) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4 mt-2 sm:mt-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TrendingUp className="text-green-600 flex-shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-gray-600 truncate">Equivalente en {destino.nombre}</p>
            {tasaCambio && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                1 {monedaOrigen.codigo} = {tasaCambio.toFixed(4)} {destino.codigo}
              </p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          {cargando || cargandoCotizaciones ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="text-green-600 animate-spin" size={14} />
              <span className="text-xs sm:text-sm text-gray-500">Cargando...</span>
            </div>
          ) : montoConvertido !== null ? (
            <p className="text-base sm:text-lg font-bold text-green-700">
              {formatearMonto(montoConvertido, destino)}
            </p>
          ) : (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle size={14} />
              <span className="text-xs">Sin cotización</span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={actualizarCotizaciones}
        className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
        disabled={cargando || cargandoCotizaciones}
      >
        <RefreshCw size={12} className={cargando || cargandoCotizaciones ? 'animate-spin' : ''} />
        Actualizar cotización
      </button>
    </div>
  );
}
