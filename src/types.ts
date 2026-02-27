export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  moneda?: string; // Código de moneda (ej: 'USD', 'ARS', 'EUR')
}

export interface Categoria {
  id: string;
  nombre: string;
  color: string;
  icono: string;
}

export interface Estadisticas {
  totalGastos: number;
  promedioDiario: number;
  promedioMensual: number;
  gastoPorCategoria: Record<string, number>;
  gastoDelMes: number;
  gastoDelDia: number;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  fechaCreacion: string;
}

export interface PresupuestoMensual {
  id: string;
  userId: string;
  anioMes: string; // Formato YYYY-MM
  moneda: string; // Código de moneda (ej: 'ARS', 'USD')
  monto: number; // Monto asignado para el mes en la moneda indicada
}

export interface GastoFijo {
  id: string;
  userId: string;
  anioMes: string; // YYYY-MM al que pertenece el gasto fijo
  descripcion: string;
  monto: number;
  categoria: string;
  moneda: string; // Moneda en la que se registró el gasto fijo
  diaVencimiento?: number; // Opcional: día del mes (1-31)
}

export interface Ingreso {
  id: string;
  userId: string;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  moneda: string;
  created_at?: string;
}

export interface MetaAhorro {
  id: string;
  userId: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  moneda: string;
  fechaLimite?: string; // YYYY-MM-DD opcional
}

export interface PresupuestoCategoria {
  id: string;
  userId: string;
  anioMes: string; // YYYY-MM
  categoriaId: string;
  monto: number; // Límite para esa categoría en el mes
  moneda: string;
}
