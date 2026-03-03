import { CATEGORIAS } from '../constants/categorias';

export interface ParseFraseResult {
  descripcion: string;
  monto?: number;
  categoriaId?: string;
  fecha?: string; // ISO yyyy-mm-dd
}

const categoriaKeywords: Record<string, string[]> = {
  alimentacion: [
    'comida',
    'almuerzo',
    'cena',
    'desayuno',
    'restaurante',
    'bar',
    'caf\u00e9',
    'cafe',
    'supermercado',
    'super',
    'kiosco',
    'kiosko',
    'mercado',
  ],
  transporte: [
    'taxi',
    'uber',
    'cabify',
    'nafta',
    'combustible',
    'subte',
    'colectivo',
    'bondi',
    'bus',
    'tren',
    'peaje',
    'estacionamiento',
    'parking',
  ],
  entretenimiento: [
    'cine',
    'netflix',
    'spotify',
    'fiesta',
    'salida',
    'concierto',
    'teatro',
    'juego',
    'gaming',
  ],
  salud: [
    'farmacia',
    'm\u00e9dico',
    'medico',
    'dentista',
    'dentista',
    'analisis',
    'an\u00e1lisis',
    'clinica',
    'cl\u00ednica',
  ],
  compras: [
    'ropa',
    'remera',
    'pantal\u00f3n',
    'pantalon',
    'zapatillas',
    'electr\u00f3nica',
    'electronica',
    'amazon',
    'mercado libre',
    'ml',
  ],
  servicios: [
    'luz',
    'gas',
    'agua',
    'internet',
    'wifi',
    'tel\u00e9fono',
    'telefono',
    'celular',
    'm\u00f3vil',
    'movil',
    'servicio',
    'servicios',
  ],
  educacion: [
    'curso',
    'colegio',
    'facultad',
    'universidad',
    'libro',
    'clase',
  ],
};

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatearFechaISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function detectarFecha(frase: string, fechaBaseISO: string): string | undefined {
  const lower = normalizarTexto(frase);
  const base = new Date(fechaBaseISO);

  if (lower.includes('hoy')) {
    return fechaBaseISO;
  }
  if (lower.includes('ayer')) {
    const d = new Date(base);
    d.setDate(d.getDate() - 1);
    return formatearFechaISO(d);
  }
  if (lower.includes('anteayer') || lower.includes('antes de ayer')) {
    const d = new Date(base);
    d.setDate(d.getDate() - 2);
    return formatearFechaISO(d);
  }

  // dd/mm(/yyyy) o dd-mm(-yyyy)
  const match = lower.match(
    /(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/,
  );
  if (match) {
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10) - 1;
    const baseDate = new Date(fechaBaseISO);
    const anio = match[3]
      ? parseInt(match[3].length === 2 ? `20${match[3]}` : match[3], 10)
      : baseDate.getFullYear();
    const d = new Date(anio, mes, dia);
    if (!isNaN(d.getTime())) {
      return formatearFechaISO(d);
    }
  }

  return undefined;
}

function detectarCategoria(frase: string): string | undefined {
  const lower = normalizarTexto(frase);

  for (const [categoriaId, keywords] of Object.entries(categoriaKeywords)) {
    for (const k of keywords) {
      if (lower.includes(k)) {
        const existe = CATEGORIAS.find((c) => c.id === categoriaId);
        if (existe) return categoriaId;
      }
    }
  }

  return undefined;
}

function detectarMonto(frase: string): number | undefined {
  const conPuntos = frase.replace(',', '.');
  const match = conPuntos.match(/(\d+([.]\d+)?)/);
  if (!match) return undefined;
  const valor = parseFloat(match[1]);
  return Number.isFinite(valor) && valor > 0 ? valor : undefined;
}

export function parseFraseGasto(
  frase: string,
  _monedaActual: string,
  fechaBaseISO: string,
): ParseFraseResult {
  const descripcion = frase.trim();
  const monto = detectarMonto(frase);
  const categoriaId = detectarCategoria(frase);
  const fecha = detectarFecha(frase, fechaBaseISO);

  return {
    descripcion,
    monto,
    categoriaId,
    fecha,
  };
}

