import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Gasto } from '../../types';
import { convertirGastos } from '../useEstadisticasEnPesos';

const gasto = (monto: number, moneda?: string): Gasto => ({
  id: `${monto}-${moneda}`,
  descripcion: 'test',
  monto,
  categoria: 'otros',
  fecha: '2026-10-13',
  moneda,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  const datos = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  });
  fetchMock = vi.fn(async (url: string) => {
    const base = url.split('/').pop();
    if (base === 'EUR') return new Response('boom', { status: 500 });
    return new Response(JSON.stringify({ result: 'success', rates: { ARS: 1500 } }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('convertirGastos', () => {
  it('convierte con una llamada por moneda de origen', async () => {
    const convertidos = await convertirGastos([gasto(1, 'USD'), gasto(2, 'USD'), gasto(100, 'ARS')], 'ARS');
    expect(convertidos?.map((g) => g.monto)).toEqual([1500, 3000, 100]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gastos sin moneda se toman en la moneda destino, sin llamar a la API', async () => {
    const convertidos = await convertirGastos([gasto(100)], 'ARS');
    expect(convertidos?.[0].monto).toBe(100);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si falta una cotización devuelve null en vez de convertir 1:1', async () => {
    expect(await convertirGastos([gasto(1, 'USD'), gasto(10, 'EUR')], 'ARS')).toBeNull();
  });
});
