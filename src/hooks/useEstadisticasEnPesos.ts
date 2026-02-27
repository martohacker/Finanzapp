import { useState, useEffect, useRef } from 'react';
import { Gasto, Estadisticas } from '../types';
import { obtenerTipoCambio } from '../services/exchangeRate';

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
        const ahora = new Date();
        const fechaActual = ahora.toISOString().split('T')[0];
        const mesActual = ahora.getMonth();
        const añoActual = ahora.getFullYear();

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

        let totalGastos = 0;
        let gastoDelMes = 0;
        let gastoDelDia = 0;
        const gastoPorCategoria: Record<string, number> = {};

        for (const g of gastos) {
          if (cancelRef.current) return;
          const origen = g.moneda || monedaDestino;
          const tasa = origen === monedaDestino ? 1 : (tasasMap.get(`${origen}|${monedaDestino}`) ?? 1);
          const montoConvertido = g.monto * tasa;

          totalGastos += montoConvertido;

          const fechaGasto = new Date(g.fecha);
          if (fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual) {
            gastoDelMes += montoConvertido;
          }

          if (g.fecha === fechaActual) {
            gastoDelDia += montoConvertido;
          }

          const catId = g.categoria || 'otros';
          gastoPorCategoria[catId] = (gastoPorCategoria[catId] || 0) + montoConvertido;
        }

        if (cancelRef.current) return;

        const diasDelMes = ahora.getDate();
        const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

        const diasTotal =
          gastos.length > 0
            ? Math.max(
                1,
                Math.ceil(
                  (ahora.getTime() - new Date(gastos[gastos.length - 1].fecha).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 1;
        const promedioMensual = (totalGastos / diasTotal) * 30;

        setEstadisticasConvertidas({
          totalGastos,
          promedioDiario,
          promedioMensual,
          gastoPorCategoria,
          gastoDelMes,
          gastoDelDia,
        });
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

