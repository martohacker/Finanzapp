import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { Gasto, GastoFijo, PresupuestoMensual } from '../types';
import { useEstadisticasConvertidas } from './useEstadisticasEnPesos';

const obtenerAnioMesActual = () => {
  const ahora = new Date();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}`;
};

const presupuestoStorageKey = (userId: string, anioMes: string) =>
  `finanzapp-presupuesto-${userId}-${anioMes}`;

interface UsePresupuestoMensualOptions {
  userId: string | null;
  monedaDestino: string;
  gastos: Gasto[];
}

interface UsePresupuestoMensualResult {
  presupuesto: PresupuestoMensual | null;
  gastosFijos: GastoFijo[];
  cargando: boolean;
  error: string | null;
  actualizarMontoPresupuesto: (monto: number) => Promise<void>;
  agregarGastoFijo: (datos: Omit<GastoFijo, 'id' | 'userId' | 'anioMes'>) => Promise<void>;
  editarGastoFijo: (id: string, datos: Partial<Omit<GastoFijo, 'id' | 'userId' | 'anioMes'>>) => Promise<void>;
  eliminarGastoFijo: (id: string) => Promise<void>;
  totalGastadoConvertido: number;
  restanteConvertido: number;
  porcentajeUsado: number;
}

export function usePresupuestoMensual({
  userId,
  monedaDestino,
  gastos,
}: UsePresupuestoMensualOptions): UsePresupuestoMensualResult {
  const [presupuesto, setPresupuesto] = useState<PresupuestoMensual | null>(null);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anioMes = useMemo(obtenerAnioMesActual, []);

  const { estadisticasConvertidas } = useEstadisticasConvertidas(gastos, monedaDestino);

  // Cargar presupuesto y gastos fijos desde Firestore (mostrar caché al instante si hay)
  useEffect(() => {
    const cargar = async () => {
      if (!userId || !isFirebaseConfigured() || !db) {
        setCargando(false);
        return;
      }

      const key = presupuestoStorageKey(userId, anioMes);
      const stored = localStorage.getItem(key);
      let mostreCache = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { presupuesto: PresupuestoMensual | null; gastosFijos: GastoFijo[] };
          if (parsed && Array.isArray(parsed.gastosFijos)) {
            setPresupuesto(parsed.presupuesto ?? null);
            setGastosFijos(parsed.gastosFijos);
            setCargando(false);
            mostreCache = true;
          }
        } catch { /* noop */ }
      }
      if (!mostreCache) setCargando(true);
      setError(null);

      try {
        // Presupuesto mensual
        const presupuestosRef = collection(db, 'presupuestos');
        const q = query(
          presupuestosRef,
          where('user_id', '==', userId),
          where('anio_mes', '==', anioMes)
        );
        const snapshot = await getDocs(q);

        let presupuestoActual: PresupuestoMensual | null = null;
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          presupuestoActual = {
            id: docSnap.id,
            userId,
            anioMes,
            moneda: (data.moneda as string) || monedaDestino,
            monto: (data.monto as number) || 0,
          };
          setPresupuesto(presupuestoActual);
        } else {
          // Crear presupuesto inicial en 0
          const nuevo = {
            user_id: userId,
            anio_mes: anioMes,
            moneda: monedaDestino,
            monto: 0,
            created_at: new Date().toISOString(),
          };
          const docRef = await addDoc(presupuestosRef, nuevo);
          presupuestoActual = {
            id: docRef.id,
            userId,
            anioMes,
            moneda: monedaDestino,
            monto: 0,
          };
          setPresupuesto(presupuestoActual);
        }

        // Gastos fijos
        const gastosFijosRef = collection(db, 'gastosFijos');
        const qFijos = query(
          gastosFijosRef,
          where('user_id', '==', userId),
          where('anio_mes', '==', anioMes)
        );
        const snapshotFijos = await getDocs(qFijos);
        const lista: GastoFijo[] = [];
        snapshotFijos.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            userId,
            anioMes,
            descripcion: (data.descripcion as string) || '',
            monto: (data.monto as number) || 0,
            categoria: (data.categoria as string) || 'otros',
            moneda: (data.moneda as string) || monedaDestino,
            diaVencimiento: data.dia_vencimiento as number | undefined,
          });
        });
        setGastosFijos(lista);
        localStorage.setItem(key, JSON.stringify({ presupuesto: presupuestoActual, gastosFijos: lista }));
      } catch (e) {
        console.error('Error al cargar presupuesto/gastos fijos:', e);
        setError('No se pudo cargar el presupuesto del mes.');
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [userId, monedaDestino, anioMes]);

  const actualizarMontoPresupuesto = useCallback(
    async (monto: number) => {
      if (!userId || !isFirebaseConfigured() || !db) return;

      try {
        setError(null);
        if (!presupuesto) {
          // Crear si no existe aún (caso muy raro porque lo creamos en el load)
          const ref = collection(db, 'presupuestos');
          const docRef = await addDoc(ref, {
            user_id: userId,
            anio_mes: anioMes,
            moneda: monedaDestino,
            monto,
            created_at: new Date().toISOString(),
          });
          setPresupuesto({
            id: docRef.id,
            userId,
            anioMes,
            moneda: monedaDestino,
            monto,
          });
        } else {
          const ref = doc(db, 'presupuestos', presupuesto.id);
          await updateDoc(ref, {
            monto,
            moneda: monedaDestino,
            updated_at: new Date().toISOString(),
          });
          setPresupuesto({ ...presupuesto, monto, moneda: monedaDestino });
        }
      } catch (e) {
        console.error('Error al actualizar presupuesto:', e);
        setError('No se pudo actualizar el presupuesto.');
      }
    },
    [userId, presupuesto, monedaDestino, anioMes]
  );

  const agregarGastoFijo = useCallback(
    async (datos: Omit<GastoFijo, 'id' | 'userId' | 'anioMes'>) => {
      if (!userId || !isFirebaseConfigured() || !db) return;

      try {
        setError(null);
        const ref = collection(db, 'gastosFijos');
        const docRef = await addDoc(ref, {
          user_id: userId,
          anio_mes: anioMes,
          descripcion: datos.descripcion,
          monto: datos.monto,
          categoria: datos.categoria,
          moneda: datos.moneda,
          dia_vencimiento: datos.diaVencimiento ?? null,
          created_at: new Date().toISOString(),
        });
        setGastosFijos((prev) => [
          ...prev,
          {
            id: docRef.id,
            userId,
            anioMes,
            ...datos,
          },
        ]);
      } catch (e) {
        console.error('Error al agregar gasto fijo:', e);
        setError('No se pudo agregar el gasto fijo.');
      }
    },
    [userId, anioMes]
  );

  const editarGastoFijo = useCallback(
    async (id: string, datos: Partial<Omit<GastoFijo, 'id' | 'userId' | 'anioMes'>>) => {
      if (!userId || !isFirebaseConfigured() || !db) return;
      try {
        setError(null);
        const ref = doc(db, 'gastosFijos', id);
        const payload: Record<string, unknown> = {};
        if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
        if (datos.monto !== undefined) payload.monto = datos.monto;
        if (datos.categoria !== undefined) payload.categoria = datos.categoria;
        if (datos.moneda !== undefined) payload.moneda = datos.moneda;
        if (datos.diaVencimiento !== undefined) payload.dia_vencimiento = datos.diaVencimiento;
        payload.updated_at = new Date().toISOString();
        await updateDoc(ref, payload);
        setGastosFijos((prev) =>
          prev.map((g) => (g.id === id ? { ...g, ...datos } : g))
        );
      } catch (e) {
        console.error('Error al editar gasto fijo:', e);
        setError('No se pudo editar el gasto fijo.');
      }
    },
    [userId]
  );

  const eliminarGastoFijo = useCallback(
    async (id: string) => {
      if (!userId || !isFirebaseConfigured() || !db) return;
      try {
        setError(null);
        const ref = doc(db, 'gastosFijos', id);
        await deleteDoc(ref);
        setGastosFijos((prev) => prev.filter((g) => g.id !== id));
      } catch (e) {
        console.error('Error al eliminar gasto fijo:', e);
        setError('No se pudo eliminar el gasto fijo.');
      }
    },
    [userId]
  );

  // Cálculos en la moneda destino: gastos variables convertidos + fijos (ya en monedaDestino)
  const totalGastadoConvertido = useMemo(() => {
    const base = estadisticasConvertidas?.totalGastos ?? 0;
    const fijos = gastosFijos.reduce((sum, g) => sum + g.monto, 0);
    return base + fijos;
  }, [estadisticasConvertidas, gastosFijos]);

  const restanteConvertido = useMemo(() => {
    if (!presupuesto) return 0;
    return Math.max(0, presupuesto.monto - totalGastadoConvertido);
  }, [presupuesto, totalGastadoConvertido]);

  const porcentajeUsado = useMemo(() => {
    if (!presupuesto || presupuesto.monto <= 0) return 0;
    return Math.min(100, (totalGastadoConvertido / presupuesto.monto) * 100);
  }, [presupuesto, totalGastadoConvertido]);

  return {
    presupuesto,
    gastosFijos,
    cargando,
    error,
    actualizarMontoPresupuesto,
    agregarGastoFijo,
    editarGastoFijo,
    eliminarGastoFijo,
    totalGastadoConvertido,
    restanteConvertido,
    porcentajeUsado,
  };
}

