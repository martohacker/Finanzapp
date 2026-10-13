/**
 * Helpers de fechas en hora LOCAL.
 *
 * Las fechas de los gastos se guardan como strings 'YYYY-MM-DD' (día calendario,
 * sin hora ni zona). Nunca hay que usar `toISOString()` (devuelve UTC) ni
 * `new Date('YYYY-MM-DD')` (lo interpreta como medianoche UTC): en Argentina
 * (UTC-3) eso corre la fecha un día. Acá los strings se parsean a mano y los
 * Date se leen siempre con getFullYear/getMonth/getDate locales.
 */

export interface PartesFecha {
  anio: number;
  /** 0-11, igual que Date#getMonth */
  mes: number;
  dia: number;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

/** Formatea un Date como 'YYYY-MM-DD' según el calendario local. */
export function formatFechaLocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Fecha de hoy en hora local, como 'YYYY-MM-DD'. */
export function hoyLocal(ahora: Date = new Date()): string {
  return formatFechaLocal(ahora);
}

/** Parte un 'YYYY-MM-DD' en año/mes/día sin pasar por Date. */
export function parseFechaLocal(fecha: string): PartesFecha {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return { anio, mes: mes - 1, dia };
}

/** Convierte un 'YYYY-MM-DD' en un Date a medianoche local (para aritmética o display). */
export function fechaLocalADate(fecha: string): Date {
  const { anio, mes, dia } = parseFechaLocal(fecha);
  return new Date(anio, mes, dia);
}

/** Mes (0-11) de un 'YYYY-MM-DD'. */
export function mesDeFecha(fecha: string): number {
  return parseFechaLocal(fecha).mes;
}

/** Año de un 'YYYY-MM-DD'. */
export function anioDeFecha(fecha: string): number {
  return parseFechaLocal(fecha).anio;
}

/** ¿El 'YYYY-MM-DD' cae en el mes (0-11) y año indicados? */
export function esDelMes(fecha: string, anio: number, mes: number): boolean {
  const p = parseFechaLocal(fecha);
  return p.anio === anio && p.mes === mes;
}

/** ¿El 'YYYY-MM-DD' cae en el mes calendario actual (hora local)? */
export function esDelMesActual(fecha: string, ahora: Date = new Date()): boolean {
  return esDelMes(fecha, ahora.getFullYear(), ahora.getMonth());
}

/** Suma (o resta) días a un 'YYYY-MM-DD' y devuelve otro 'YYYY-MM-DD'. */
export function sumarDias(fecha: string, dias: number): string {
  const d = fechaLocalADate(fecha);
  d.setDate(d.getDate() + dias);
  return formatFechaLocal(d);
}

/** Días calendario entre dos 'YYYY-MM-DD' (hasta - desde), inmune a cambios de horario. */
export function diasEntre(desde: string, hasta: string): number {
  const a = parseFechaLocal(desde);
  const b = parseFechaLocal(hasta);
  const ms = Date.UTC(b.anio, b.mes, b.dia) - Date.UTC(a.anio, a.mes, a.dia);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Formatea un 'YYYY-MM-DD' como 'DD/MM/YYYY' para mostrar. */
export function formatFechaCorta(fecha: string): string {
  const { anio, mes, dia } = parseFechaLocal(fecha);
  return `${pad2(dia)}/${pad2(mes + 1)}/${anio}`;
}
