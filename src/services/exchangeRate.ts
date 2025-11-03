// API gratuita para obtener cotizaciones
const API_BASE_URL = 'https://api.exchangerate.host';

export interface ExchangeRates {
  [key: string]: number;
}

export interface ExchangeRateResponse {
  success: boolean;
  rates: ExchangeRates;
  base: string;
  date: string;
}

/**
 * Obtiene las tasas de cambio desde una moneda base
 */
export async function obtenerCotizaciones(monedaBase: string): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/latest?base=${monedaBase}`);
    const data = await response.json();
    
    if (data.success && data.rates) {
      return data.rates;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return null;
  }
}

/**
 * Convierte un monto de una moneda a otra
 */
export function convertirMoneda(
  monto: number,
  monedaOrigen: string,
  monedaDestino: string,
  tasas: ExchangeRates
): number {
  if (monedaOrigen === monedaDestino) {
    return monto;
  }

  // Si la moneda base es la de origen, usar la tasa directa
  if (tasas[monedaDestino]) {
    return monto * tasas[monedaDestino];
  }

  // Si necesitamos convertir primero a la base y luego a destino
  // Por simplicidad, asumimos que las tasas están desde la base
  return monto * (tasas[monedaDestino] || 1);
}

/**
 * Obtiene el tipo de cambio entre dos monedas
 */
export async function obtenerTipoCambio(
  monedaOrigen: string,
  monedaDestino: string
): Promise<number | null> {
  if (monedaOrigen === monedaDestino) {
    return 1;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/convert?from=${monedaOrigen}&to=${monedaDestino}`
    );
    const data = await response.json();
    
    if (data.success && data.result) {
      return data.result;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener tipo de cambio:', error);
    return null;
  }
}

/**
 * Obtiene tipos de cambio de múltiples monedas desde una base
 */
export async function obtenerMultiplesTasas(
  monedaBase: string,
  monedasDestino: string[]
): Promise<Record<string, number> | null> {
  try {
    const symbols = monedasDestino.join(',');
    const response = await fetch(
      `${API_BASE_URL}/latest?base=${monedaBase}&symbols=${symbols}`
    );
    const data = await response.json();
    
    if (data.success && data.rates) {
      return data.rates;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener múltiples tasas:', error);
    return null;
  }
}
