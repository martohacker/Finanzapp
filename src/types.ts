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
