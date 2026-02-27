import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Target, Bell } from 'lucide-react';

const STORAGE_KEY = 'finanzapp-onboarding-done';

export function Onboarding({ onCerrar }: { onCerrar: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hecho = localStorage.getItem(STORAGE_KEY);
    if (!hecho) setVisible(true);
  }, []);

  const handleCerrar = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onCerrar();
  };

  if (!visible) return null;

  const pasos = [
    { icono: Wallet, titulo: 'Gastos e ingresos', texto: 'Registrá cada gasto e ingreso para tener el control total.' },
    { icono: TrendingUp, titulo: 'Balance y estadísticas', texto: 'Mirá cuánto gastás por mes y cuánto te queda.' },
    { icono: Target, titulo: 'Metas y presupuesto', texto: 'Definí presupuestos y metas de ahorro para alcanzar tus objetivos.' },
    { icono: Bell, titulo: 'Recordatorios', texto: 'Te avisamos cuando te acercás al límite o vencen gastos fijos.' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-slate-600 max-w-md w-full p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">
          ¡Bienvenido a FinanzApp!
        </h2>
        <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
          Con FinanzApp podés llevar tus finanzas personales al día. Acá te contamos en 4 pasos.
        </p>
        <ul className="space-y-4 mb-6">
          {pasos.map((p, i) => {
            const Icon = p.icono;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                  <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-slate-200">{p.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{p.texto}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={handleCerrar}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold transition-colors"
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
