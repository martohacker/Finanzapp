import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { MetaAhorro } from '../types';

const storageKey = (userId: string | null) =>
  userId ? `finanzapp-metas-${userId}` : 'finanzapp-metas-temp';

function docToMeta(id: string, data: Record<string, unknown>, userId: string): MetaAhorro {
  return {
    id,
    userId,
    nombre: (data.nombre as string) ?? '',
    montoObjetivo: typeof data.monto_objetivo === 'number' ? data.monto_objetivo : Number(data.monto_objetivo ?? 0) || 0,
    montoActual: typeof data.monto_actual === 'number' ? data.monto_actual : Number(data.monto_actual ?? 0) || 0,
    moneda: (data.moneda as string) || 'ARS',
    fechaLimite: data.fecha_limite as string | undefined,
  };
}

export function useMetasAhorro(userId: string | null, usandoFirebase: boolean) {
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [cargando, setCargando] = useState(true);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userId) {
      setMetas([]);
      setCargando(false);
      return;
    }

    const key = storageKey(userId);

    if (usandoFirebase && isFirebaseConfigured() && db) {
      // Mostrar caché al instante tras el login; Firestore actualiza en segundo plano
      const stored = localStorage.getItem(key);
      let mostreCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MetaAhorro[];
          if (Array.isArray(parsed)) {
            setMetas(parsed);
            setCargando(false);
            mostreCache = true;
          }
        } catch { /* noop */ }
      }
      if (!mostreCache) setCargando(true);

      const q = query(
        collection(db, 'metasAhorro'),
        where('user_id', '==', userId)
      );
      unsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          const list: MetaAhorro[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docToMeta(docSnap.id, docSnap.data(), userId));
          });
          setMetas(list);
          setCargando(false);
          if (list.length > 0) localStorage.setItem(key, JSON.stringify(list));
        },
        () => {
          setCargando(false);
          const stored = localStorage.getItem(key);
          if (stored) try { setMetas(JSON.parse(stored)); } catch { /* noop */ }
        }
      );
      return () => {
        if (unsubRef.current) unsubRef.current();
        unsubRef.current = null;
      };
    }

    const stored = localStorage.getItem(key);
    if (stored) try { setMetas(JSON.parse(stored)); } catch { /* noop */ }
    setCargando(false);
    return undefined;
  }, [userId, usandoFirebase]);

  const guardarLocal = useCallback(
    (list: MetaAhorro[]) => {
      if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(list));
    },
    [userId]
  );

  const agregarMeta = useCallback(
    async (datos: Omit<MetaAhorro, 'id' | 'userId'>) => {
      const nueva: MetaAhorro = {
        ...datos,
        id: `temp-${Date.now()}`,
        userId: userId!,
      };
      const list = [...metas, nueva];
      setMetas(list);

      if (usandoFirebase && isFirebaseConfigured() && db) {
        try {
          const ref = await addDoc(collection(db, 'metasAhorro'), {
            user_id: userId,
            nombre: datos.nombre,
            monto_objetivo: datos.montoObjetivo,
            monto_actual: datos.montoActual,
            moneda: datos.moneda || 'ARS',
            fecha_limite: datos.fechaLimite ?? null,
            created_at: Timestamp.now(),
          });
          setMetas((prev) => prev.map((m) => (m.id === nueva.id ? { ...m, id: ref.id } : m)));
          guardarLocal(list.map((m) => (m.id === nueva.id ? { ...m, id: ref.id } : m)));
        } catch {
          guardarLocal(list);
        }
      } else {
        guardarLocal(list);
      }
    },
    [userId, metas, usandoFirebase, guardarLocal]
  );

  const actualizarMontoActual = useCallback(
    async (id: string, montoActual: number) => {
      const list = metas.map((m) => (m.id === id ? { ...m, montoActual } : m));
      setMetas(list);

      if (usandoFirebase && isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'metasAhorro', id), {
            monto_actual: montoActual,
            updated_at: Timestamp.now(),
          });
        } catch { /* noop */ }
      }
      guardarLocal(list);
    },
    [metas, usandoFirebase, guardarLocal]
  );

  const eliminarMeta = useCallback(
    async (id: string) => {
      if (usandoFirebase && isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, 'metasAhorro', id));
        } catch { /* noop */ }
      }
      const list = metas.filter((m) => m.id !== id);
      setMetas(list);
      guardarLocal(list);
    },
    [metas, usandoFirebase, guardarLocal]
  );

  return { metas, cargando, agregarMeta, actualizarMontoActual, eliminarMeta };
}
