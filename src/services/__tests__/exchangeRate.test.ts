import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { convertirMonto, obtenerTasas, obtenerTipoCambio } from '../exchangeRate';

const API = 'https://open.er-api.com/v6/latest';

/** localStorage en memoria (vitest corre en node, sin DOM). */
class MemoryStorage {
  private datos = new Map<string, string>();
  getItem(k: string) { return this.datos.get(k) ?? null; }
  setItem(k: string, v: string) { this.datos.set(k, String(v)); }
  removeItem(k: string) { this.datos.delete(k); }
  clear() { this.datos.clear(); }
  key(i: number) { return [...this.datos.keys()][i] ?? null; }
  get length() { return this.datos.size; }
}

const respuestaOk = (base: string, rates: Record<string, number>) =>
  new Response(JSON.stringify({ result: 'success', base_code: base, rates }), { status: 200 });

const TASAS_USD = { USD: 1, ARS: 1500, EUR: 0.9, BRL: 5.5 };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T12:00:00-03:00'));
  vi.stubGlobal('localStorage', new MemoryStorage());
  fetchMock = vi.fn(async (url: string) => {
    const base = url.split('/').pop()!;
    return respuestaOk(base, base === 'USD' ? TASAS_USD : { [base]: 1, ARS: 1600 });
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('una sola llamada por moneda base', () => {
  it('convertir varios pares desde USD hace un único fetch', async () => {
    expect(await obtenerTipoCambio('USD', 'ARS')).toBe(1500);
    expect(await obtenerTipoCambio('USD', 'EUR')).toBe(0.9);
    expect(await convertirMonto(10, 'USD', 'BRL')).toBe(55);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${API}/USD`);
  });

  it('llamadas concurrentes comparten el mismo fetch', async () => {
    const resultados = await Promise.all([
      obtenerTipoCambio('USD', 'ARS'),
      obtenerTipoCambio('USD', 'EUR'),
      obtenerTasas('USD'),
    ]);
    expect(resultados[0]).toBe(1500);
    expect(resultados[1]).toBe(0.9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cada moneda base tiene su propia llamada', async () => {
    await obtenerTipoCambio('USD', 'ARS');
    await obtenerTipoCambio('EUR', 'ARS');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API}/EUR`);
  });

  it('misma moneda no llama a la API', async () => {
    expect(await obtenerTipoCambio('ARS', 'ARS')).toBe(1);
    expect(await convertirMonto(100, 'ARS', 'ARS')).toBe(100);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('caché de 1 hora', () => {
  it('dentro de la hora no vuelve a llamar; pasada la hora sí', async () => {
    await obtenerTipoCambio('USD', 'ARS');
    vi.advanceTimersByTime(59 * 60 * 1000);
    await obtenerTipoCambio('USD', 'ARS');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * 60 * 1000);
    await obtenerTipoCambio('USD', 'ARS');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('forzar ignora el caché', async () => {
    await obtenerTasas('USD');
    await obtenerTasas('USD', { forzar: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('si la API falla la conversión es null, nunca 1:1', () => {
  it('error de red', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await obtenerTipoCambio('USD', 'ARS')).toBeNull();
    expect(await convertirMonto(100, 'USD', 'ARS')).toBeNull();
  });

  it('HTTP 500', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    expect(await convertirMonto(100, 'USD', 'ARS')).toBeNull();
  });

  it('result: error con HTTP 200 (así responde open.er-api.com)', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ result: 'error', 'error-type': 'unsupported-code' }), { status: 200 })
    );
    expect(await convertirMonto(100, 'USD', 'ARS')).toBeNull();
  });

  it('moneda destino ausente en la respuesta', async () => {
    expect(await convertirMonto(100, 'USD', 'XYZ')).toBeNull();
  });

  it('un fallo no queda cacheado: el próximo intento vuelve a llamar', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await obtenerTipoCambio('USD', 'ARS')).toBeNull();
    expect(await obtenerTipoCambio('USD', 'ARS')).toBe(1500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
