import { Moneda } from '../constants/monedas';

export function formatearMonto(monto: number, moneda: Moneda, maximumFractionDigits?: number): string {
  return new Intl.NumberFormat(moneda.locale, {
    style: 'currency',
    currency: moneda.codigo,
    ...(maximumFractionDigits !== undefined && { maximumFractionDigits }),
  }).format(monto);
}
