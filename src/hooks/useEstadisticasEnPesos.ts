import { useState, useEffect } from 'react';
import { Gasto, Estadisticas } from '../types';
import { obtenerTipoCambio } from '../services/exchangeRate';
import { calcularEstadisticasFromGastos } from '../utils/estadisticas';

interface UseEstadisticasConvertidasResult {
  estadisticasConvertidas: Estadisticas | null;
  cargandoConvertidas: boolean;
  /** true si falta alguna cotización: no hay números confiables para mostrar */
  cotizacionNoDisponible: boolean;
}

/**
 * Convierte los montos de los gastos a la moneda destino (una consulta por moneda
 * de origen). Devuelve null si falta alguna cotización: nunca asume 1:1.
 */
export async function convertirGastos(gastos: Gasto[], monedaDestino: string): Promise<Gasto[] | null> {
  const origenes = [...new Set(gastos.map((g) => g.moneda || monedaDestino))];
  const tasas = await Promise.all(origenes.map((origen) => obtenerTipoCambio(origen, monedaDestino)));
  if (tasas.some((tasa) => tasa === null)) return null;

  const tasaPorOrigen = new Map(origenes.map((origen, i) => [origen, tasas[i] as number]));
  return gastos.map((g) => ({ ...g, monto: g.monto * tasaPorOrigen.get(g.moneda || monedaDestino)! }));
}

// Convierte todas las estadísticas a la moneda de destino indicada (ej: 'ARS', 'USD')
export function useEstadisticasConvertidas(
  gastos: Gasto[],
  monedaDestino: string
): UseEstadisticasConvertidasResult {
  const [estadisticasConvertidas, setEstadisticasConvertidas] = useState<Estadisticas | null>(null);
  const [cargandoConvertidas, setCargandoConvertidas] = useState(false);
  const [cotizacionNoDisponible, setCotizacionNoDisponible] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const calcular = async () => {
      setCargandoConvertidas(true);
      const convertidos = await convertirGastos(gastos, monedaDestino);
      if (cancelado) return;

      if (convertidos === null) {
        setEstadisticasConvertidas(null);
        setCotizacionNoDisponible(true);
      } else {
        setEstadisticasConvertidas(calcularEstadisticasFromGastos(convertidos));
        setCotizacionNoDisponible(false);
      }
      setCargandoConvertidas(false);
    };

    calcular();
    return () => {
      cancelado = true;
    };
  }, [gastos, monedaDestino]);

  return { estadisticasConvertidas, cargandoConvertidas, cotizacionNoDisponible };
}
