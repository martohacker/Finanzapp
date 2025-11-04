import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

const obtenerStorageKey = (userId: string | null) => 
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

export function useGastosFirebase(userId: string | null, usandoFirebase: boolean) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar gastos desde Firebase o localStorage
  useEffect(() => {
    if (!userId) {
      setGastos([]);
      setCargando(false);
      return;
    }

    const cargarGastos = async () => {
      setCargando(true);
      
      if (usandoFirebase && isFirebaseConfigured() && db) {
        // Cargar desde Firebase
        console.log('📥 Intentando cargar gastos desde Firebase para userId:', userId);
        try {
          const gastosRef = collection(db, 'gastos');
          
          // Intentar primero con orderBy (requiere índice compuesto)
          let querySnapshot;
          try {
            const q = query(
              gastosRef,
              where('user_id', '==', userId),
              orderBy('fecha', 'desc')
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query con orderBy exitosa');
          } catch (orderByError: any) {
            // Si falla con orderBy, intentar sin orderBy y ordenar en el cliente
            console.warn('⚠️ Query con orderBy falló, intentando sin orderBy:', orderByError?.code);
            const q = query(
              gastosRef,
              where('user_id', '==', userId)
            );
            querySnapshot = await getDocs(q);
            console.log('✅ Query sin orderBy exitosa (ordenando en cliente)');
          }

          const gastosConvertidos: Gasto[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            gastosConvertidos.push({
              id: docSnap.id,
              descripcion: data.descripcion,
              monto: data.monto,
              categoria: data.categoria,
              fecha: data.fecha,
              moneda: data.moneda || 'ARS', // Por defecto ARS si no existe
            });
          });

          // Ordenar por fecha descendente si no se ordenó en la query
          if (gastosConvertidos.length > 0) {
            gastosConvertidos.sort((a, b) => {
              // Comparar fechas en formato ISO (YYYY-MM-DD)
              return b.fecha.localeCompare(a.fecha);
            });
          }

          console.log(`✅ Cargados ${gastosConvertidos.length} gastos desde Firebase`);
          setGastos(gastosConvertidos);
          
          // Guardar también en localStorage como backup
          if (gastosConvertidos.length > 0) {
            const storageKey = obtenerStorageKey(userId);
            localStorage.setItem(storageKey, JSON.stringify(gastosConvertidos));
          }
        } catch (error: any) {
          console.error('❌ Error al cargar desde Firebase:', error);
          console.error('Detalles del error:', {
            message: error instanceof Error ? error.message : String(error),
            code: error?.code,
          });
          
          // Si es un error de índice faltante, mostrar ayuda
          if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.error('🔴 ERROR: Falta crear un índice compuesto en Firestore.');
            console.error('📋 Ve a Firebase Console → Firestore Database → Indexes');
            console.error('📋 Crea un índice para:');
            console.error('   - Collection: gastos');
            console.error('   - Fields: user_id (Ascending), fecha (Descending)');
            console.error('   - Scope: Collection');
          }
          
          // Fallback a localStorage
          cargarDesdeLocalStorage();
        }
      } else {
        console.warn('⚠️ No se usa Firebase para cargar. Razones:', {
          usandoFirebase,
          isFirebaseConfigured: isFirebaseConfigured(),
          tieneDb: !!db,
        });
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
  }, [userId, usandoFirebase]);

  // Guardar en Firebase cuando cambien
  const guardarGasto = async (gasto: Gasto, esNuevo: boolean) => {
    console.log('🔍 guardarGasto llamado:', {
      usandoFirebase,
      isFirebaseConfigured: isFirebaseConfigured(),
      tieneDb: !!db,
      tieneUserId: !!userId,
      esNuevo,
    });

    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      try {
        const gastosRef = collection(db, 'gastos');
        
        if (esNuevo) {
          // Insertar nuevo gasto
          console.log('💾 Guardando nuevo gasto en Firebase:', gasto.descripcion);
          const docRef = await addDoc(gastosRef, {
            user_id: userId,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS', // Por defecto ARS
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          console.log('✅ Gasto guardado en Firebase con ID:', docRef.id);
        } else {
          // Actualizar gasto existente
          console.log('💾 Actualizando gasto en Firebase:', gasto.id);
          const gastoRef = doc(db, 'gastos', gasto.id);
          await updateDoc(gastoRef, {
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS', // Por defecto ARS
            updated_at: Timestamp.now(),
          });
          console.log('✅ Gasto actualizado en Firebase');
        }
      } catch (error: any) {
        console.error('❌ Error al guardar en Firebase:', error);
        console.error('Detalles del error:', {
          message: error instanceof Error ? error.message : String(error),
          code: error?.code,
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        // Si es un error de permisos, mostrar ayuda
        if (error?.code === 'permission-denied') {
          console.error('🔴 ERROR: Permisos denegados. Verifica las reglas de seguridad en Firestore.');
        }
        
        guardarEnLocalStorage();
      }
    } else {
      console.warn('⚠️ No se usa Firebase. Razones:', {
        usandoFirebase,
        isFirebaseConfigured: isFirebaseConfigured(),
        tieneDb: !!db,
        tieneUserId: !!userId,
      });
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
    
    // Agregar primero al estado para respuesta inmediata
    setGastos([nuevoGasto, ...gastos]);
    
    // Guardar en Firebase/localStorage
    await guardarGasto(nuevoGasto, true);
    
    // Si se guardó en Firebase, recargar para obtener el ID real
    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      // Recargar gastos para obtener el ID real de Firebase
      const gastosRef = collection(db, 'gastos');
      let querySnapshot;
      try {
        const q = query(
          gastosRef,
          where('user_id', '==', userId),
          orderBy('fecha', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch {
        // Si falla con orderBy, intentar sin orderBy
        const q = query(
          gastosRef,
          where('user_id', '==', userId)
        );
        querySnapshot = await getDocs(q);
      }
      
      const gastosActualizados: Gasto[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        gastosActualizados.push({
          id: docSnap.id,
          descripcion: data.descripcion,
          monto: data.monto,
          categoria: data.categoria,
          fecha: data.fecha,
          moneda: data.moneda || 'ARS', // Por defecto ARS
        });
      });
      
      // Ordenar por fecha si no se ordenó en la query
      gastosActualizados.sort((a, b) => b.fecha.localeCompare(a.fecha));
      setGastos(gastosActualizados);
    }
  };

  const eliminarGasto = async (id: string) => {
    if (usandoFirebase && isFirebaseConfigured() && db && userId) {
      try {
        const gastoRef = doc(db, 'gastos', id);
        await deleteDoc(gastoRef);
      } catch (error) {
        console.error('Error al eliminar en Firebase:', error);
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

