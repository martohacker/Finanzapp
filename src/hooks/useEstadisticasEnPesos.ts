import { useState, useEffect, useRef } from 'react';
import { Gasto, Estadisticas } from '../types';
import { obtenerTipoCambio } from '../services/exchangeRate';
import { calcularEstadisticasFromGastos } from '../utils/estadisticas';

interface UseEstadisticasConvertidasResult {
  estadisticasConvertidas: Estadisticas | null;
  cargandoConvertidas: boolean;
}

const crearEstadisticasVacias = (): Estadisticas => ({
  totalGastos: 0,
  promedioDiario: 0,
  promedioMensual: 0,
  gastoPorCategoria: {},
  gastoDelMes: 0,
  gastoDelDia: 0,
});

// Cache de tasas por par "origen|destino" para no llamar la API por cada gasto
const cacheTasas = new Map<string, number>();

async function getTasa(origen: string, destino: string): Promise<number> {
  if (origen === destino) return 1;
  const key = `${origen}|${destino}`;
  if (cacheTasas.has(key)) return cacheTasas.get(key)!;
  const tasa = await obtenerTipoCambio(origen, destino);
  if (tasa != null) cacheTasas.set(key, tasa);
  return tasa ?? 1;
}

// Convierte todas las estadísticas a la moneda de destino indicada (ej: 'ARS', 'USD')
export function useEstadisticasConvertidas(
  gastos: Gasto[],
  monedaDestino: string
): UseEstadisticasConvertidasResult {
  const [estadisticasConvertidas, setEstadisticasConvertidas] = useState<Estadisticas | null>(null);
  const [cargandoConvertidas, setCargandoConvertidas] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    const calcular = async () => {
      if (!gastos.length) {
        setEstadisticasConvertidas(crearEstadisticasVacias());
        return;
      }

      setCargandoConvertidas(true);
      try {
        // Obtener tasas solo para pares únicos (máximo 1 request por moneda distinta)
        const paresUnicos = new Set<string>();
        for (const g of gastos) {
          const origen = g.moneda || monedaDestino;
          if (origen !== monedaDestino) paresUnicos.add(`${origen}|${monedaDestino}`);
        }
        const tasasMap = new Map<string, number>();
        for (const par of paresUnicos) {
          if (cancelRef.current) return;
          const [origen, destino] = par.split('|');
          const tasa = await getTasa(origen, destino);
          tasasMap.set(par, tasa);
        }

        const gastosConvertidos = gastos.map((g) => {
          const origen = g.moneda || monedaDestino;
          const tasa = origen === monedaDestino ? 1 : (tasasMap.get(`${origen}|${monedaDestino}`) ?? 1);
          return { ...g, monto: g.monto * tasa };
        });

        if (cancelRef.current) return;

        setEstadisticasConvertidas(calcularEstadisticasFromGastos(gastosConvertidos));
      } catch (error) {
        if (!cancelRef.current) {
          console.error('Error al calcular estadísticas convertidas:', error);
          setEstadisticasConvertidas(crearEstadisticasVacias());
        }
      } finally {
        if (!cancelRef.current) setCargandoConvertidas(false);
      }
    };

    calcular();
    return () => { cancelRef.current = true; };
  }, [gastos, monedaDestino]);

  return { estadisticasConvertidas, cargandoConvertidas };
}

