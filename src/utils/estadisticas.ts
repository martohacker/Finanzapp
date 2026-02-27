import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

/**
 * Calcula estadísticas a partir de un array de gastos (útil para períodos filtrados).
 */
export function calcularEstadisticasFromGastos(gastos: Gasto[]): Estadisticas {
  const ahora = new Date();
  const fechaActual = ahora.toISOString().split('T')[0];
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  const gastosDelDia = gastos.filter((g) => g.fecha === fechaActual);
  const gastosDelMes = gastos.filter((g) => {
    const fechaGasto = new Date(g.fecha);
    return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
  });

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const gastoDelDia = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
  const gastoDelMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

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

  const gastoPorCategoria: Record<string, number> = {};
  CATEGORIAS.forEach((cat) => {
    gastoPorCategoria[cat.id] = gastos
      .filter((g) => g.categoria === cat.id)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  return {
    totalGastos,
    promedioDiario,
    promedioMensual,
    gastoPorCategoria,
    gastoDelMes,
    gastoDelDia,
  };
}

export function rangoEstaSemana(): { desde: string; hasta: string } {
  const hoy = new Date();
  const dia = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return {
    desde: lunes.toISOString().split('T')[0],
    hasta: domingo.toISOString().split('T')[0],
  };
}

export function rangoMesActual(): { desde: string; hasta: string } {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = (hoy.getMonth() + 1).toString().padStart(2, '0');
  const ultimoDia = new Date(y, hoy.getMonth() + 1, 0).getDate();
  return {
    desde: `${y}-${m}-01`,
    hasta: `${y}-${m}-${ultimoDia.toString().padStart(2, '0')}`,
  };
}

export function rangoMesAnterior(): { desde: string; hasta: string } {
  const hoy = new Date();
  const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1);
  const y = mesPasado.getFullYear();
  const m = (mesPasado.getMonth() + 1).toString().padStart(2, '0');
  const ultimoDia = new Date(y, mesPasado.getMonth() + 1, 0).getDate();
  return {
    desde: `${y}-${m}-01`,
    hasta: `${y}-${m}-${ultimoDia.toString().padStart(2, '0')}`,
  };
}

export type PeriodoFiltro = 'mes' | 'semana' | 'mesAnterior';

export function filtrarGastosPorPeriodo(
  gastos: Gasto[],
  periodo: PeriodoFiltro
): Gasto[] {
  const { desde, hasta } =
    periodo === 'semana'
      ? rangoEstaSemana()
      : periodo === 'mesAnterior'
        ? rangoMesAnterior()
        : rangoMesActual();
  return gastos.filter((g) => g.fecha >= desde && g.fecha <= hasta);
}
