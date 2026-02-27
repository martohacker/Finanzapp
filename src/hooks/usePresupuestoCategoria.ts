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
import { PresupuestoCategoria } from '../types';

const ANIO_MES = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const storageKey = (userId: string | null) =>
  userId ? `finanzapp-presupuesto-cat-${userId}` : 'finanzapp-presupuesto-cat-temp';

function docToPresupuestoCat(id: string, data: Record<string, unknown>, userId: string): PresupuestoCategoria {
  return {
    id,
    userId,
    anioMes: (data.anio_mes as string) ?? ANIO_MES(),
    categoriaId: (data.categoria_id as string) ?? '',
    monto: typeof data.monto === 'number' ? data.monto : Number(data.monto ?? 0) || 0,
    moneda: (data.moneda as string) || 'ARS',
  };
}

export function usePresupuestoCategoria(userId: string | null, usandoFirebase: boolean) {
  const [presupuestosCat, setPresupuestosCat] = useState<PresupuestoCategoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const anioMes = ANIO_MES();

  useEffect(() => {
    if (!userId) {
      setPresupuestosCat([]);
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
          const parsed = JSON.parse(stored) as PresupuestoCategoria[];
          if (Array.isArray(parsed)) {
            setPresupuestosCat(parsed);
            setCargando(false);
            mostreCache = true;
          }
        } catch { /* noop */ }
      }
      if (!mostreCache) setCargando(true);

      const q = query(
        collection(db, 'presupuestoCategoria'),
        where('user_id', '==', userId),
        where('anio_mes', '==', anioMes)
      );
      unsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          const list: PresupuestoCategoria[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docToPresupuestoCat(docSnap.id, docSnap.data(), userId));
          });
          setPresupuestosCat(list);
          setCargando(false);
          if (list.length > 0) localStorage.setItem(key, JSON.stringify(list));
        },
        () => {
          setCargando(false);
          const stored = localStorage.getItem(key);
          if (stored) try { setPresupuestosCat(JSON.parse(stored)); } catch { /* noop */ }
        }
      );
      return () => {
        if (unsubRef.current) unsubRef.current();
        unsubRef.current = null;
      };
    }

    const stored = localStorage.getItem(key);
    if (stored) try { setPresupuestosCat(JSON.parse(stored)); } catch { /* noop */ }
    setCargando(false);
    return undefined;
  }, [userId, usandoFirebase, anioMes]);

  const guardarLocal = useCallback(
    (list: PresupuestoCategoria[]) => {
      if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(list));
    },
    [userId]
  );

  const guardarOActualizar = useCallback(
    async (categoriaId: string, monto: number, moneda: string) => {
      const existente = presupuestosCat.find((p) => p.categoriaId === categoriaId);
      const list = existente
        ? presupuestosCat.map((p) =>
            p.categoriaId === categoriaId ? { ...p, monto, moneda } : p
          )
        : [
            ...presupuestosCat,
            {
              id: `temp-${Date.now()}`,
              userId: userId!,
              anioMes,
              categoriaId,
              monto,
              moneda,
            } as PresupuestoCategoria,
          ];
      setPresupuestosCat(list);

      if (usandoFirebase && isFirebaseConfigured() && db) {
        try {
          if (existente) {
            await updateDoc(doc(db, 'presupuestoCategoria', existente.id), {
              monto,
              moneda,
              updated_at: Timestamp.now(),
            });
          } else {
            const ref = await addDoc(collection(db, 'presupuestoCategoria'), {
              user_id: userId,
              anio_mes: anioMes,
              categoria_id: categoriaId,
              monto,
              moneda,
              created_at: Timestamp.now(),
            });
            setPresupuestosCat((prev) =>
              prev.map((p) => (p.id === list[list.length - 1].id ? { ...p, id: ref.id } : p))
            );
          }
        } catch { /* noop */ }
      }
      guardarLocal(list);
    },
    [userId, presupuestosCat, anioMes, usandoFirebase, guardarLocal]
  );

  const eliminarPorCategoria = useCallback(
    async (categoriaId: string) => {
      const item = presupuestosCat.find((p) => p.categoriaId === categoriaId);
      const list = presupuestosCat.filter((p) => p.categoriaId !== categoriaId);
      setPresupuestosCat(list);

      if (item && usandoFirebase && isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, 'presupuestoCategoria', item.id));
        } catch { /* noop */ }
      }
      guardarLocal(list);
    },
    [presupuestosCat, usandoFirebase, guardarLocal]
  );

  return {
    presupuestosPorCategoria: presupuestosCat,
    cargando,
    guardarOActualizar,
    eliminarPorCategoria,
  };
}
