import { useState, useEffect } from 'react';
import { MONEDA_DEFAULT, MONEDAS, Moneda } from '../constants/monedas';

const STORAGE_KEY = 'finanzapp-moneda';

export function useMoneda() {
  const [moneda, setMoneda] = useState<string>(MONEDA_DEFAULT);

  // Cargar moneda del localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && MONEDAS.find(m => m.codigo === stored)) {
      setMoneda(stored);
    }
  }, []);

  // Guardar moneda en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, moneda);
  }, [moneda]);

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
