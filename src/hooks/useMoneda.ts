import { useState, useEffect } from 'react';
import { MONEDA_DEFAULT, MONEDAS, Moneda } from '../constants/monedas';

const obtenerStorageKey = (userId: string | null) => 
  userId ? `finanzapp-moneda-${userId}` : 'finanzapp-moneda-temp';

export function useMoneda(userId: string | null) {
  const [moneda, setMoneda] = useState<string>(MONEDA_DEFAULT);

  // Cargar moneda del localStorage al iniciar o cambiar usuario
  useEffect(() => {
    const storageKey = obtenerStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    if (stored && MONEDAS.find(m => m.codigo === stored)) {
      setMoneda(stored);
    } else {
      setMoneda(MONEDA_DEFAULT);
    }
  }, [userId]);

  // Guardar moneda en localStorage cuando cambie
  useEffect(() => {
    if (userId) {
      const storageKey = obtenerStorageKey(userId);
      localStorage.setItem(storageKey, moneda);
    }
  }, [moneda, userId]);

  const cambiarMoneda = (codigoMoneda: string) => {
    if (MONEDAS.find(m => m.codigo === codigoMoneda)) {
      setMoneda(codigoMoneda);
    }
  };

  const obtenerMoneda = (): Moneda => {
    return MONEDAS.find(m => m.codigo === moneda) || MONEDAS[0];
  };

  return {
    moneda,
    cambiarMoneda,
    obtenerMoneda,
  };
}
