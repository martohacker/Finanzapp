import { useState, useEffect, useCallback } from 'react';
import { convertirMonto, obtenerTasas } from '../services/exchangeRate';

interface Cotizaciones {
  [key: string]: number; // moneda -> tasa de cambio
}

const STORAGE_KEY = 'finanzapp-cotizaciones';
const STORAGE_TIMESTAMP_KEY = 'finanzapp-cotizaciones-timestamp';
const CACHE_DURATION = 3600000; // 1 hora en milisegundos

export function useCotizaciones(monedaBase: string, monedaDestino: string = 'ARS') {
  const [cotizaciones, setCotizaciones] = useState<Cotizaciones>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cotizaciones del cache si están frescas
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      
      if (now - cacheTime < CACHE_DURATION) {
        try {
          setCotizaciones(JSON.parse(cached));
          return;
        } catch (e) {
          // Si hay error al parsear, continuar para obtener nuevas
        }
      }
    }
  }, []);

  const actualizarCotizaciones = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const tasas = await obtenerTasas(monedaBase);

      if (tasas) {
        // Guardar en cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasas));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        setCotizaciones(tasas);
      } else {
        setError('No se pudieron obtener las cotizaciones');
      }
    } catch (err) {
      setError('Error al actualizar cotizaciones');
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [monedaBase]);

  // Actualizar cotizaciones al cambiar la moneda base
  useEffect(() => {
    if (monedaBase && monedaBase !== monedaDestino) {
      actualizarCotizaciones();
    } else {
      // Si la base ya es la moneda destino, establecer tasa 1:1
      const tasasIniciales: Cotizaciones = {};
      tasasIniciales[monedaDestino] = 1;
      setCotizaciones(tasasIniciales);
    }
  }, [monedaBase, monedaDestino, actualizarCotizaciones]);

  const convertirAPesos = useCallback((monto: number, monedaOrigen: string): number => {
    if (monedaOrigen === monedaDestino) {
      return monto;
    }

    // Esta función es más simple y solo se usa para referencia
    // La conversión real se hace con convertirDirecto
    return monto;
  }, [monedaDestino]);

  // Convierte usando la API; null si no hay cotización (nunca asume 1:1)
  const convertirDirecto = useCallback(
    (monto: number, monedaOrigen: string, monedaDestino: string = 'ARS'): Promise<number | null> =>
      convertirMonto(monto, monedaOrigen, monedaDestino),
    []
  );

  return {
    cotizaciones,
    cargando,
    error,
    actualizarCotizaciones,
    convertirAPesos,
    convertirDirecto,
  };
}
