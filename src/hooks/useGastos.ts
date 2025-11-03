import { useState, useEffect } from 'react';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

const obtenerStorageKey = (userId: string | null) => 
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

export function useGastos(userId: string | null) {
  const [gastos, setGastos] = useState<Gasto[]>([]);

  // Cargar gastos del localStorage al iniciar o cambiar usuario
  useEffect(() => {
    const storageKey = obtenerStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setGastos(JSON.parse(stored));
      } catch (error) {
        console.error('Error al cargar gastos:', error);
      }
    } else {
      setGastos([]);
    }
  }, [userId]);

  // Guardar gastos en localStorage cuando cambien
  useEffect(() => {
    if (userId) {
      const storageKey = obtenerStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(gastos));
    }
  }, [gastos, userId]);

  const agregarGasto = (gasto: Omit<Gasto, 'id'>) => {
    const nuevoGasto: Gasto = {
      ...gasto,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setGastos([nuevoGasto, ...gastos]);
  };

  const eliminarGasto = (id: string) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const editarGasto = (id: string, gastoActualizado: Omit<Gasto, 'id'>) => {
    setGastos(gastos.map(g => 
      g.id === id 
        ? { ...gastoActualizado, id }
        : g
    ));
  };

  const calcularEstadisticas = (): Estadisticas => {
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const gastosDelDia = gastos.filter(g => g.fecha === fechaActual);
    const gastosDelMes = gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
    });

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelDia = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

    // Calcular días transcurridos en el mes
    const diasDelMes = ahora.getDate();
    const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

    // Calcular promedio mensual basado en días totales
    const diasTotal = gastos.length > 0 
      ? Math.max(1, Math.ceil((ahora.getTime() - new Date(gastos[gastos.length - 1].fecha).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const promedioMensual = (totalGastos / diasTotal) * 30;

    const gastoPorCategoria: Record<string, number> = {};
    CATEGORIAS.forEach(cat => {
      gastoPorCategoria[cat.id] = gastos
        .filter(g => g.categoria === cat.id)
        .reduce((sum, g) => sum + g.monto, 0);
    });

    return {
      totalGastos,
      promedioDiario,
      promedioMensual,
      gastoPorCategoria,
      gastoDelMes,
      gastoDelDia,
    };
  };

  return {
    gastos,
    agregarGasto,
    eliminarGasto,
    editarGasto,
    calcularEstadisticas,
  };
}
