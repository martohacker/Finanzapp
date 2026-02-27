import { useState, useEffect } from 'react';
import { Gasto, Estadisticas } from '../types';
import { useCotizaciones } from './useCotizaciones';

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

// Convierte todas las estadísticas a la moneda de destino indicada (ej: 'ARS', 'USD')
export function useEstadisticasConvertidas(
  gastos: Gasto[],
  monedaDestino: string
): UseEstadisticasConvertidasResult {
  const [estadisticasConvertidas, setEstadisticasConvertidas] = useState<Estadisticas | null>(null);
  const [cargandoConvertidas, setCargandoConvertidas] = useState(false);

  const { convertirDirecto } = useCotizaciones(monedaDestino, monedaDestino);

  useEffect(() => {
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

        let totalGastos = 0;
        let gastoDelMes = 0;
        let gastoDelDia = 0;
        const gastoPorCategoria: Record<string, number> = {};

        for (const g of gastos) {
          const origen = g.moneda || monedaDestino;
          const montoConvertido = await convertirDirecto(g.monto, origen, monedaDestino);

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
        console.error('Error al calcular estadísticas convertidas:', error);
        setEstadisticasConvertidas(crearEstadisticasVacias());
      } finally {
        setCargandoConvertidas(false);
      }
    };

    calcular();
  }, [gastos, convertirDirecto, monedaDestino]);

  return { estadisticasConvertidas, cargandoConvertidas };
}

