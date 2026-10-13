import { useState, useEffect } from 'react';
import { Gasto } from '../types';

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

  return {
    gastos,
    agregarGasto,
    eliminarGasto,
    editarGasto,
  };
}
