import { useState, useEffect, useMemo } from 'react';
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

interface ResultadoConversion {
  gastos: Gasto[];
  monedaDestino: string;
  estadisticas: Estadisticas | null;
}

// Convierte todas las estadísticas a la moneda de destino indicada (ej: 'ARS', 'USD').
// Mientras la conversión está pendiente devuelve estadisticasConvertidas = null y
// cargandoConvertidas = true: nunca expone montos sin convertir ni de un cálculo anterior.
export function useEstadisticasConvertidas(
  gastos: Gasto[],
  monedaDestino: string
): UseEstadisticasConvertidasResult {
  // Si todo está en la moneda destino no hace falta la API: cálculo sincrónico, sin carga
  const sinConversion = useMemo(
    () =>
      gastos.every((g) => (g.moneda || monedaDestino) === monedaDestino)
        ? calcularEstadisticasFromGastos(gastos)
        : null,
    [gastos, monedaDestino]
  );
  const [resultado, setResultado] = useState<ResultadoConversion | null>(null);

  useEffect(() => {
    if (sinConversion) return;
    let cancelado = false;

    convertirGastos(gastos, monedaDestino).then((convertidos) => {
      if (cancelado) return;
      setResultado({
        gastos,
        monedaDestino,
        estadisticas: convertidos === null ? null : calcularEstadisticasFromGastos(convertidos),
      });
    });

    return () => {
      cancelado = true;
    };
  }, [gastos, monedaDestino, sinConversion]);

  if (sinConversion) {
    return { estadisticasConvertidas: sinConversion, cargandoConvertidas: false, cotizacionNoDisponible: false };
  }

  // Solo vale el resultado calculado para estos mismos gastos y moneda
  const vigente = resultado !== null && resultado.gastos === gastos && resultado.monedaDestino === monedaDestino;
  if (!vigente) {
    return { estadisticasConvertidas: null, cargandoConvertidas: true, cotizacionNoDisponible: false };
  }
  return {
    estadisticasConvertidas: resultado.estadisticas,
    cargandoConvertidas: false,
    cotizacionNoDisponible: resultado.estadisticas === null,
  };
}
