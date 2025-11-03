export interface Moneda {
  codigo: string;
  nombre: string;
  simbolo: string;
  locale: string;
}

export const MONEDAS: Moneda[] = [
  { codigo: 'EUR', nombre: 'Euro', simbolo: '€', locale: 'es-ES' },
  { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', locale: 'en-US' },
  { codigo: 'MXN', nombre: 'Peso Mexicano', simbolo: '$', locale: 'es-MX' },
  { codigo: 'GBP', nombre: 'Libra Esterlina', simbolo: '£', locale: 'en-GB' },
  { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', locale: 'es-AR' },
  { codigo: 'CLP', nombre: 'Peso Chileno', simbolo: '$', locale: 'es-CL' },
  { codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$', locale: 'es-CO' },
  { codigo: 'PEN', nombre: 'Sol Peruano', simbolo: 'S/', locale: 'es-PE' },
  { codigo: 'BRL', nombre: 'Real Brasileño', simbolo: 'R$', locale: 'pt-BR' },
];

export const MONEDA_DEFAULT = 'ARS';
