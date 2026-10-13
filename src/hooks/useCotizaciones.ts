import { useState, useCallback } from 'react';
import { convertirMonto, obtenerTasas } from '../services/exchangeRate';

export function useCotizaciones(monedaBase: string) {
  const [cargando, setCargando] = useState(false);
  // Cambia al forzar una actualización para que convertirDirecto cambie de
  // identidad y los componentes que lo usan en un efecto vuelvan a convertir.
  const [version, setVersion] = useState(0);

  const actualizarCotizaciones = useCallback(async () => {
    setCargando(true);
    try {
      await obtenerTasas(monedaBase, { forzar: true });
    } finally {
      setCargando(false);
      setVersion((v) => v + 1);
    }
  }, [monedaBase]);

  // Convierte usando la API; null si no hay cotización (nunca asume 1:1)
  const convertirDirecto = useCallback(
    (monto: number, monedaOrigen: string, monedaDestino: string = 'ARS'): Promise<number | null> =>
      convertirMonto(monto, monedaOrigen, monedaDestino),
    [version]
  );

  return {
    cargando,
    actualizarCotizaciones,
    convertirDirecto,
  };
}
