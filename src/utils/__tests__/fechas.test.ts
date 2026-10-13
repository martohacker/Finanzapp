import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hoyLocal } from '../fechas';

describe('hoyLocal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a las 22:30 hora Argentina devuelve el día actual, no el de mañana', () => {
    vi.setSystemTime(new Date('2026-10-13T22:30:00-03:00'));
    expect(hoyLocal()).toBe('2026-10-13');
  });
});
