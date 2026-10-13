import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  diasEntre,
  esDelMes,
  esDelMesActual,
  formatFechaCorta,
  hoyLocal,
  parseFechaLocal,
  sumarDias,
} from '../fechas';

describe('hoyLocal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a las 22:30 hora Argentina devuelve el día actual, no el de mañana', () => {
    vi.setSystemTime(new Date('2026-10-13T22:30:00-03:00'));
    expect(hoyLocal()).toBe('2026-10-13');
  });

  it('a las 00:30 hora Argentina devuelve el día actual, no el de ayer', () => {
    vi.setSystemTime(new Date('2026-10-14T00:30:00-03:00'));
    expect(hoyLocal()).toBe('2026-10-14');
  });
});

describe('parseFechaLocal', () => {
  it('parte el string sin corrimiento de zona', () => {
    expect(parseFechaLocal('2026-10-01')).toEqual({ anio: 2026, mes: 9, dia: 1 });
  });
});

describe('helpers de mes', () => {
  it('2026-10-01 es de octubre', () => {
    expect(esDelMes('2026-10-01', 2026, 9)).toBe(true);
    expect(esDelMes('2026-10-01', 2026, 8)).toBe(false);
  });

  it('esDelMesActual usa el mes local', () => {
    const ahora = new Date('2026-10-01T22:30:00-03:00');
    expect(esDelMesActual('2026-10-01', ahora)).toBe(true);
    expect(esDelMesActual('2026-09-30', ahora)).toBe(false);
  });
});

describe('aritmética de fechas', () => {
  it('sumarDias cruza meses y años', () => {
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('diasEntre cuenta días calendario', () => {
    expect(diasEntre('2026-10-01', '2026-10-13')).toBe(12);
    expect(diasEntre('2026-10-13', '2026-10-13')).toBe(0);
  });

  it('formatFechaCorta', () => {
    expect(formatFechaCorta('2026-10-01')).toBe('01/10/2026');
  });
});
