import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  Timestamp,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../services/firebase';
import { Gasto, Estadisticas } from '../types';
import { CATEGORIAS } from '../constants/categorias';

const obtenerStorageKey = (userId: string | null) =>
  userId ? `finanzapp-gastos-${userId}` : 'finanzapp-gastos-temp';

function docToGasto(id: string, data: Record<string, unknown>): Gasto {
  return {
    id,
    descripcion: (data.descripcion as string) ?? '',
    monto:
      typeof data.monto === 'number'
        ? (data.monto as number)
        : Number(data.monto ?? 0) || 0,
    categoria: (data.categoria as string) ?? 'otros',
    fecha: (data.fecha as string) ?? '',
    moneda: (data.moneda as string) || 'ARS',
  };
}

/** Query simple sin orderBy (no requiere índice compuesto); útil para getDocs de fallback */
function buildGastosQuerySimple(userId: string): Query | null {
  if (!db) return null;
  const gastosRef = collection(db, 'gastos');
  return query(gastosRef, where('user_id', '==', userId));
}

/** Construye la query de gastos del usuario, con fallback sin orderBy si falta índice */
function buildGastosQuery(userId: string): Query | null {
  if (!db) return null;
  const gastosRef = collection(db, 'gastos');
  try {
    return query(
      gastosRef,
      where('user_id', '==', userId),
      orderBy('fecha', 'desc')
    );
  } catch {
    return query(gastosRef, where('user_id', '==', userId));
  }
}



export function useGastosFirebase(userId: string | null, usandoFirebase: boolean) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorFirebase, setErrorFirebase] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const guardarEnLocalStorage = useCallback(
    (gastosToSave?: Gasto[]) => {
      if (!userId) return;
      const list = gastosToSave ?? gastos;
      localStorage.setItem(obtenerStorageKey(userId), JSON.stringify(list));
    },
    [userId, gastos]
  );

  // Sincronizar gastos locales a Firebase (solo cuando Firebase está vacío y hay datos locales)
  const sincronizarLocalesAFirebase = useCallback(
    async (_gastosLocal: Gasto[]) => {
      // Sincronización desactivada para evitar datos corruptos desde localStorage
      return;
    },
    []
  );

  // Suscripción en tiempo real a Firestore o carga desde localStorage
  useEffect(() => {
    // Log de diagnóstico para entender qué pasa en producción
    try {
      console.log('[useGastosFirebase] init efecto', {
        userId,
        usandoFirebase,
        firebaseConfigurado: isFirebaseConfigured(),
        tieneDB: !!db,
        origen: window.location.origin,
      });
    } catch {
      // ignore en entornos sin window/console
    }

    if (!userId) {
      setGastos([]);
      setCargando(false);
      setErrorFirebase(null);
      return;
    }

    const storageKey = obtenerStorageKey(userId);

    if (usandoFirebase && isFirebaseConfigured() && db) {
      const q = buildGastosQuery(userId);
      if (!q) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setGastos(JSON.parse(stored));
          } catch { /* noop */ }
        }
        setCargando(false);
        return;
      }

      // Mostrar caché al instante tras el login; Firestore actualiza en segundo plano
      const stored = localStorage.getItem(storageKey);
      let mostreCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Gasto[];
          if (Array.isArray(parsed)) {
            setGastos(parsed);
            setCargando(false);
            mostreCache = true;
          }
        } catch { /* noop */ }
      }
      if (!mostreCache) setCargando(true);
      setErrorFirebase(null);

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          try {
            console.log('[useGastosFirebase] snapshot recibido', {
              size: snapshot.size,
            });
          } catch {
            // ignore
          }
          const list: Gasto[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            list.push(docToGasto(docSnap.id, data));
          });
          if (list.length > 0) {
            list.sort((a, b) => b.fecha.localeCompare(a.fecha));
          }
          setGastos(list);
          setCargando(false);
          if (list.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(list));
          } else {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const local = JSON.parse(stored) as Gasto[];
                if (local?.length > 0) {
                  sincronizarLocalesAFirebase(local);
                }
              } catch {
                // ignore
              }
            }
          }
        },
        (err: { code?: string; message?: string }) => {
          try {
            console.error('[useGastosFirebase] error en onSnapshot', err);
          } catch {
            // ignore
          }
          setCargando(false);
          setErrorFirebase(err?.message ?? 'Error al conectar con Firebase');
          if (err?.code === 'failed-precondition' || err?.message?.includes('index')) {
            setErrorFirebase('Falta crear un índice en Firestore (ver consola)');
          }
          // Fallback 1: intentar una lectura única con getDocs (sin orderBy, no depende del índice)
          const qSimple = buildGastosQuerySimple(userId);
          if (qSimple) {
            getDocs(qSimple)
              .then((snapshot) => {
                const list: Gasto[] = [];
                snapshot.forEach((docSnap) => {
                  const data = docSnap.data() as Record<string, unknown>;
                  list.push(docToGasto(docSnap.id, data));
                });
                if (list.length > 0) {
                  list.sort((a, b) => b.fecha.localeCompare(a.fecha));
                  setGastos(list);
                  setErrorFirebase(null);
                  localStorage.setItem(storageKey, JSON.stringify(list));
                }
              })
              .catch(() => { /* getDocs también falló, usar localStorage abajo */ });
          }
          // Fallback 2: localStorage
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setGastos(JSON.parse(stored));
            } catch {
              setGastos([]);
            }
          } else {
            setGastos([]);
          }
          // Si hay datos en localStorage y Firebase devolvió 0 antes del error, intentar sync
          const storedRaw = localStorage.getItem(storageKey);
          if (storedRaw) {
            try {
              const local = JSON.parse(storedRaw) as Gasto[];
              if (local?.length > 0) {
                sincronizarLocalesAFirebase(local);
              }
            } catch {
              // ignore
            }
          }
        }
      );

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }

    // Sin Firebase: cargar solo desde localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setGastos(JSON.parse(stored));
      } catch {
        setGastos([]);
      }
    } else {
      setGastos([]);
    }
    setCargando(false);
    setErrorFirebase(null);
    return undefined;
  }, [userId, usandoFirebase, sincronizarLocalesAFirebase]);

  // Backup en localStorage cuando cambian los gastos (solo si no estamos usando listener)
  useEffect(() => {
    if (!userId || !usandoFirebase || !isFirebaseConfigured()) {
      if (userId && gastos.length > 0) {
        guardarEnLocalStorage(gastos);
      }
    }
  }, [gastos, userId, usandoFirebase, guardarEnLocalStorage]);

  const guardarGasto = useCallback(
    async (gasto: Gasto, esNuevo: boolean, listaActual: Gasto[]) => {
      if (!usandoFirebase || !isFirebaseConfigured() || !db || !userId) {
        guardarEnLocalStorage(listaActual);
        return;
      }

      const currentUser = auth?.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        guardarEnLocalStorage(listaActual);
        return;
      }

      try {
        const gastosRef = collection(db, 'gastos');
        if (esNuevo) {
          await addDoc(gastosRef, {
            user_id: userId,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS',
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
          // onSnapshot actualizará el estado con el nuevo documento e id real
        } else {
          const gastoRef = doc(db, 'gastos', gasto.id);
          await updateDoc(gastoRef, {
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: gasto.categoria,
            fecha: gasto.fecha,
            moneda: gasto.moneda || 'ARS',
            updated_at: Timestamp.now(),
          });
        }
        setErrorFirebase(null);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        setErrorFirebase(err?.message ?? 'Error al guardar');
        guardarEnLocalStorage(listaActual);
      }
    },
    [usandoFirebase, userId, guardarEnLocalStorage]
  );

  const agregarGasto = useCallback(
    async (gasto: Omit<Gasto, 'id'>) => {
      const nuevoGasto: Gasto = {
        ...gasto,
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      const listaConNuevo = [nuevoGasto, ...gastos];
      setGastos(listaConNuevo);
      await guardarGasto(nuevoGasto, true, listaConNuevo);
    },
    [gastos, guardarGasto]
  );

  const eliminarGasto = useCallback(
    async (id: string) => {
      if (usandoFirebase && isFirebaseConfigured() && db && userId) {
        try {
          await deleteDoc(doc(db, 'gastos', id));
        } catch {
          // Si falla (ej. ya borrado), igual quitamos del estado local
        }
      }
      setGastos((prev) => prev.filter((g) => g.id !== id));
    },
    [usandoFirebase, userId]
  );

  const editarGasto = useCallback(
    async (id: string, gastoActualizado: Omit<Gasto, 'id'>) => {
      const gastoEditado: Gasto = { ...gastoActualizado, id };
      const listaActual = gastos.map((g) => (g.id === id ? gastoEditado : g));
      setGastos(listaActual);
      await guardarGasto(gastoEditado, false, listaActual);
    },
    [gastos, guardarGasto]
  );

  const calcularEstadisticas = useCallback((): Estadisticas => {
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const gastosDelDia = gastos.filter((g) => g.fecha === fechaActual);
    const gastosDelMes = gastos.filter((g) => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
    });

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelDia = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
    const gastoDelMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

    const diasDelMes = ahora.getDate();
    const promedioDiario = diasDelMes > 0 ? gastoDelMes / diasDelMes : 0;

    const diasTotal =
      gastos.length > 0
        ? Math.max(
            1,
            Math.ceil(
              (ahora.getTime() - new Date(gastos[gastos.length - 1].fecha).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;
    const promedioMensual = (totalGastos / diasTotal) * 30;

    const gastoPorCategoria: Record<string, number> = {};
    CATEGORIAS.forEach((cat) => {
      gastoPorCategoria[cat.id] = gastos
        .filter((g) => g.categoria === cat.id)
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
  }, [gastos]);

  return {
    gastos,
    cargando,
    errorFirebase,
    agregarGasto,
    eliminarGasto,
    editarGasto,
    calcularEstadisticas,
  };
}