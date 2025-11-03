import { useState, useEffect } from 'react';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { supabase } from '../services/supabase';

const obtenerStorageKey = (userId: string | null) => 
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

export function useGastosSupabase(userId: string | null, usandoSupabase: boolean) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar gastos desde Supabase o localStorage
  useEffect(() => {
    if (!userId) {
      setGastos([]);
      setCargando(false);
      return;
    }

    const cargarGastos = async () => {
      setCargando(true);
      
      if (usandoSupabase && supabase) {
        // Cargar desde Supabase
        try {
          const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .eq('user_id', userId)
            .order('fecha', { ascending: false })
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error al cargar gastos:', error);
            // Fallback a localStorage
            cargarDesdeLocalStorage();
          } else {
            // Convertir datos de Supabase a formato Gasto
            const gastosConvertidos: Gasto[] = (data || []).map(item => ({
              id: item.id,
              descripcion: item.descripcion,
              monto: item.monto,
              categoria: item.categoria,
              fecha: item.fecha,
            }));
            setGastos(gastosConvertidos);
          }
        } catch (error) {
          console.error('Error al cargar desde Supabase:', error);
          cargarDesdeLocalStorage();
        }
      } else {
        // Cargar desde localStorage
        cargarDesdeLocalStorage();
      }
      
      setCargando(false);
    };

    const cargarDesdeLocalStorage = () => {
      const storageKey = obtenerStorageKey(userId);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setGastos(JSON.parse(stored));
        } catch (error) {
          console.error('Error al cargar gastos:', error);
          setGastos([]);
        }
      } else {
        setGastos([]);
      }
    };

    cargarGastos();
  }, [userId, usandoSupabase]);

  // Guardar en Supabase cuando cambien
  const guardarGasto = async (gasto: Gasto, esNuevo: boolean) => {
    if (usandoSupabase && supabase && userId) {
      try {
        if (esNuevo) {
          // Insertar nuevo gasto
          const { error } = await supabase
            .from('gastos')
            .insert({
              id: gasto.id,
              user_id: userId,
              descripcion: gasto.descripcion,
              monto: gasto.monto,
              categoria: gasto.categoria,
              fecha: gasto.fecha,
            });

          if (error) {
            console.error('Error al guardar en Supabase:', error);
            // Fallback a localStorage
            guardarEnLocalStorage();
          }
        } else {
          // Actualizar gasto existente
          const { error } = await supabase
            .from('gastos')
            .update({
              descripcion: gasto.descripcion,
              monto: gasto.monto,
              categoria: gasto.categoria,
              fecha: gasto.fecha,
              updated_at: new Date().toISOString(),
            })
            .eq('id', gasto.id)
            .eq('user_id', userId);

          if (error) {
            console.error('Error al actualizar en Supabase:', error);
            guardarEnLocalStorage();
          }
        }
      } catch (error) {
        console.error('Error al sincronizar con Supabase:', error);
        guardarEnLocalStorage();
      }
    } else {
      guardarEnLocalStorage();
    }
  };

  const guardarEnLocalStorage = () => {
    if (userId) {
      const storageKey = obtenerStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(gastos));
    }
  };

  // Guardar en localStorage también como backup
  useEffect(() => {
    if (userId && gastos.length > 0) {
      guardarEnLocalStorage();
    }
  }, [gastos, userId]);

  const agregarGasto = async (gasto: Omit<Gasto, 'id'>) => {
    const nuevoGasto: Gasto = {
      ...gasto,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setGastos([nuevoGasto, ...gastos]);
    await guardarGasto(nuevoGasto, true);
  };

  const eliminarGasto = async (id: string) => {
    if (usandoSupabase && supabase && userId) {
      try {
        const { error } = await supabase
          .from('gastos')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Error al eliminar en Supabase:', error);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
    
    const nuevosGastos = gastos.filter(g => g.id !== id);
    setGastos(nuevosGastos);
  };

  const editarGasto = async (id: string, gastoActualizado: Omit<Gasto, 'id'>) => {
    const gastoEditado: Gasto = { ...gastoActualizado, id };
    
    setGastos(gastos.map(g => 
      g.id === id ? gastoEditado : g
    ));
    
    await guardarGasto(gastoEditado, false);
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

    const diasDelMes = ahora.getDate();
    const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

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
    cargando,
    agregarGasto,
    eliminarGasto,
    editarGasto,
    calcularEstadisticas,
  };
}

