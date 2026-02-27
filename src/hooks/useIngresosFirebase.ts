import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../services/firebase';
import { Ingreso } from '../types';

const storageKey = (userId: string | null) =>
  userId ? `finanzapp-ingresos-${userId}` : 'finanzapp-ingresos-temp';

function docToIngreso(id: string, data: Record<string, unknown>, userId: string): Ingreso {
  return {
    id,
    userId,
    descripcion: (data.descripcion as string) ?? '',
    monto: typeof data.monto === 'number' ? data.monto : Number(data.monto ?? 0) || 0,
    fecha: (data.fecha as string) ?? '',
    moneda: (data.moneda as string) || 'ARS',
  };
}

function buildIngresosQuery(userId: string): Query | null {
  if (!db) return null;
  try {
    return query(
      collection(db, 'ingresos'),
      where('user_id', '==', userId),
      orderBy('fecha', 'desc')
    );
  } catch {
    return query(
      collection(db, 'ingresos'),
      where('user_id', '==', userId)
    );
  }
}

export function useIngresosFirebase(userId: string | null, usandoFirebase: boolean) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userId) {
      setIngresos([]);
      setCargando(false);
      return;
    }

    const key = storageKey(userId);

    if (usandoFirebase && isFirebaseConfigured() && db) {
      const q = buildIngresosQuery(userId);
      if (!q) {
        const stored = localStorage.getItem(key);
        if (stored) try { setIngresos(JSON.parse(stored)); } catch { /* noop */ }
        setCargando(false);
        return;
      }

      // Mostrar caché al instante tras el login; Firestore actualiza en segundo plano
      const stored = localStorage.getItem(key);
      let mostreCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Ingreso[];
          if (Array.isArray(parsed)) {
            setIngresos(parsed);
            setCargando(false);
            mostreCache = true;
          }
        } catch { /* noop */ }
      }
      if (!mostreCache) setCargando(true);

      unsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          const list: Ingreso[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            list.push(docToIngreso(docSnap.id, data, userId));
          });
          list.sort((a, b) => b.fecha.localeCompare(a.fecha));
          setIngresos(list);
          setCargando(false);
          if (list.length > 0) localStorage.setItem(key, JSON.stringify(list));
        },
        () => {
          setCargando(false);
          const stored = localStorage.getItem(key);
          if (stored) try { setIngresos(JSON.parse(stored)); } catch { /* noop */ }
        }
      );
      return () => {
        if (unsubRef.current) unsubRef.current();
        unsubRef.current = null;
      };
    }

    const stored = localStorage.getItem(key);
    if (stored) try { setIngresos(JSON.parse(stored)); } catch { /* noop */ }
    setCargando(false);
    return undefined;
  }, [userId, usandoFirebase]);

  const guardarLocal = useCallback(
    (list: Ingreso[]) => {
      if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(list));
    },
    [userId]
  );

  const agregarIngreso = useCallback(
    async (datos: Omit<Ingreso, 'id' | 'userId'>) => {
      const nuevo: Ingreso = {
        ...datos,
        id: `temp-${Date.now()}`,
        userId: userId!,
      };
      const list = [nuevo, ...ingresos];
      setIngresos(list);

      if (usandoFirebase && isFirebaseConfigured() && db && auth?.currentUser?.uid === userId) {
        try {
          const ref = await addDoc(collection(db, 'ingresos'), {
            user_id: userId,
            descripcion: datos.descripcion,
            monto: datos.monto,
            fecha: datos.fecha,
            moneda: datos.moneda || 'ARS',
            created_at: Timestamp.now(),
          });
          setIngresos((prev) => prev.map((i) => (i.id === nuevo.id ? { ...i, id: ref.id } : i)));
          guardarLocal(list.map((i) => (i.id === nuevo.id ? { ...i, id: ref.id } : i)));
        } catch {
          guardarLocal(list);
        }
      } else {
        guardarLocal(list);
      }
    },
    [userId, ingresos, usandoFirebase, guardarLocal]
  );

  const eliminarIngreso = useCallback(
    async (id: string) => {
      if (usandoFirebase && isFirebaseConfigured() && db && userId) {
        try {
          await deleteDoc(doc(db, 'ingresos', id));
        } catch { /* noop */ }
      }
      const list = ingresos.filter((i) => i.id !== id);
      setIngresos(list);
      guardarLocal(list);
    },
    [ingresos, userId, usandoFirebase, guardarLocal]
  );

  return { ingresos, cargando, agregarIngreso, eliminarIngreso };
}
