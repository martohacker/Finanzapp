import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gasto } from '../../types';
import {
  calcularEstadisticasFromGastos,
  rangoEstaSemana,
  rangoMesActual,
  rangoMesAnterior,
} from '../estadisticas';

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

describe('rangoMesActual / rangoMesAnterior', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('el 31/10 a las 22:30 el mes actual sigue siendo octubre', () => {
    vi.setSystemTime(new Date('2026-10-31T22:30:00-03:00'));
    expect(rangoMesActual()).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
    expect(rangoMesAnterior()).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
  });

  it('en enero el mes anterior es diciembre del año pasado', () => {
    vi.setSystemTime(new Date('2027-01-15T12:00:00-03:00'));
    expect(rangoMesAnterior()).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' });
  });
});
