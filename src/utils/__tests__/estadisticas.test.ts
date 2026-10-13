import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gasto } from '../../types';
import { calcularEstadisticasFromGastos, rangoEstaSemana } from '../estadisticas';

const gasto = (fecha: string, monto: number): Gasto => ({
  id: fecha + monto,
  descripcion: 'test',
  monto,
  categoria: 'otros',
  fecha,
});

describe('calcularEstadisticasFromGastos (hora Argentina)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('un gasto del 2026-10-01 cuenta en octubre', () => {
    vi.setSystemTime(new Date('2026-10-13T12:00:00-03:00'));
    const stats = calcularEstadisticasFromGastos([gasto('2026-10-01', 100)]);
    expect(stats.gastoDelMes).toBe(100);
  });

  it('a las 22:30 un gasto de hoy cuenta como gasto del día', () => {
    vi.setSystemTime(new Date('2026-10-13T22:30:00-03:00'));
    const stats = calcularEstadisticasFromGastos([gasto('2026-10-13', 50)]);
    expect(stats.gastoDelDia).toBe(50);
  });
});

describe('rangoEstaSemana', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('el domingo a las 22:30 devuelve lunes a domingo de esa semana', () => {
    vi.setSystemTime(new Date('2026-10-11T22:30:00-03:00'));
    expect(rangoEstaSemana()).toEqual({ desde: '2026-10-05', hasta: '2026-10-11' });
  });
});
