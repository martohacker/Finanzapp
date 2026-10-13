import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { diasEntre, esDelMes, hoyLocal, sumarDias } from './fechas';

/**
 * Única implementación de las estadísticas de gastos (útil también para períodos
 * filtrados). Los montos se suman tal cual: si hay varias monedas, convertir
 * antes los gastos (ver useEstadisticasConvertidas).
 */
export function calcularEstadisticasFromGastos(
  gastos: Gasto[],
  ahora: Date = new Date()
): Estadisticas {
  const fechaActual = hoyLocal(ahora);
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  let totalGastos = 0;
  let gastoDelMes = 0;
  let gastoDelDia = 0;
  let fechaMinima: string | null = null;
  const gastoPorCategoria: Record<string, number> = {};
  CATEGORIAS.forEach((cat) => {
    gastoPorCategoria[cat.id] = 0;
  });

  for (const g of gastos) {
    totalGastos += g.monto;
    if (esDelMes(g.fecha, añoActual, mesActual)) gastoDelMes += g.monto;
    if (g.fecha === fechaActual) gastoDelDia += g.monto;
    // 'YYYY-MM-DD' ordena lexicográficamente igual que cronológicamente
    if (fechaMinima === null || g.fecha < fechaMinima) fechaMinima = g.fecha;
    const catId = g.categoria || 'otros';
    gastoPorCategoria[catId] = (gastoPorCategoria[catId] || 0) + g.monto;
  }

  const diasDelMes = ahora.getDate();
  const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

  // Días calendario desde el gasto más viejo hasta hoy, ambos inclusive
  const diasTotal = fechaMinima ? Math.max(1, diasEntre(fechaMinima, fechaActual) + 1) : 1;
  const promedioMensual = (totalGastos / diasTotal) * 30;

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
  const lunes = sumarDias(hoyLocal(hoy), -(dia === 0 ? 6 : dia - 1));
  return {
    desde: lunes,
    hasta: sumarDias(lunes, 6),
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
