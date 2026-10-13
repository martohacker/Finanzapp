// API gratuita sin API key (ExchangeRate-API, endpoint "open access").
// Actualiza una vez por día; una llamada trae todas las tasas desde la base.
// Ojo: ante un error responde HTTP 200 con { result: 'error' }.
const API_URL = 'https://open.er-api.com/v6/latest';

const CACHE_PREFIX = 'finanzapp-tasas-';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export type ExchangeRates = Record<string, number>;

interface TasasCacheadas {
  timestamp: number;
  rates: ExchangeRates;
}

// Requests en curso por base: llamadas concurrentes comparten el mismo fetch
const enCurso = new Map<string, Promise<ExchangeRates | null>>();

function leerCache(base: string): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + base);
    if (!raw) return null;
    const cache = JSON.parse(raw) as TasasCacheadas;
    if (Date.now() - cache.timestamp >= CACHE_DURATION) return null;
    return cache.rates;
  } catch {
    return null;
  }
}

function guardarCache(base: string, rates: ExchangeRates) {
  try {
    const cache: TasasCacheadas = { timestamp: Date.now(), rates };
    localStorage.setItem(CACHE_PREFIX + base, JSON.stringify(cache));
  } catch {
    // Sin storage disponible: seguimos sin caché
  }
}

async function pedirTasas(base: string): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(`${API_URL}/${base}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.result !== 'success' || !data.rates) return null;
    guardarCache(base, data.rates);
    return data.rates as ExchangeRates;
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return null;
  }
}

/**
 * Tasas desde una moneda base (1 base = rates[X] X). Cacheadas 1 hora en
 * localStorage; los fallos no se cachean. Devuelve null si la API no responde.
 */
export async function obtenerTasas(
  base: string,
  opciones: { forzar?: boolean } = {}
): Promise<ExchangeRates | null> {
  if (!opciones.forzar) {
    const cacheadas = leerCache(base);
    if (cacheadas) return cacheadas;
  }

  const pendiente = enCurso.get(base);
  if (pendiente) return pendiente;

  const request = pedirTasas(base).finally(() => enCurso.delete(base));
  enCurso.set(base, request);
  return request;
}

/** Tipo de cambio origen → destino, o null si no hay cotización disponible. */
export async function obtenerTipoCambio(
  monedaOrigen: string,
  monedaDestino: string
): Promise<number | null> {
  if (monedaOrigen === monedaDestino) return 1;
  const tasas = await obtenerTasas(monedaOrigen);
  const tasa = tasas?.[monedaDestino];
  return typeof tasa === 'number' && tasa > 0 ? tasa : null;
}

/** Convierte un monto, o null si no hay cotización disponible (nunca asume 1:1). */
export async function convertirMonto(
  monto: number,
  monedaOrigen: string,
  monedaDestino: string
): Promise<number | null> {
  const tasa = await obtenerTipoCambio(monedaOrigen, monedaDestino);
  return tasa === null ? null : monto * tasa;
}
