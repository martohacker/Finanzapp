import { useState } from 'react';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { Ingreso } from '../types';

interface BalanceCardProps {
  totalIngresosMes: number;
  gastoDelMes: number;
  ingresos: Ingreso[];
  moneda: Moneda;
  onAgregarIngreso: (datos: { descripcion: string; monto: number; fecha: string; moneda: string }) => void;
  onEliminarIngreso: (id: string) => void;
}

export function BalanceCard({
  totalIngresosMes,
  gastoDelMes,
  ingresos,
  moneda,
  onAgregarIngreso,
  onEliminarIngreso,
}: BalanceCardProps) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const fechaHoy = new Date().toISOString().split('T')[0];

  const balance = totalIngresosMes - gastoDelMes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(monto.replace(',', '.')) || 0;
    if (!descripcion.trim() || valor <= 0) return;
    onAgregarIngreso({
      descripcion: descripcion.trim(),
      monto: valor,
      fecha: fechaHoy,
      moneda: moneda.codigo,
    });
    setDescripcion('');
    setMonto('');
    setMostrarForm(false);
  };

  const ingresosDelMes = ingresos.filter((i) => {
    const [y, m] = i.fecha.split('-');
    const d = new Date();
    return y === d.getFullYear().toString() && m === (d.getMonth() + 1).toString().padStart(2, '0');
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-emerald-500" />
        Balance del mes
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-400">Ingresos</span>
          <span className="font-semibold text-gray-800 dark:text-slate-100">
            {formatearMonto(totalIngresosMes, moneda, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-slate-400">Gastos</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            -{formatearMonto(gastoDelMes, moneda, 0)}
          </span>
        </div>
        <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
          <span className="font-medium text-gray-700 dark:text-slate-300">Resto</span>
          <span
            className={`font-bold ${
              balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatearMonto(balance, moneda, 0)}
          </span>
        </div>
      </div>

      {!mostrarForm ? (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/30"
        >
          <Plus size={16} />
          Registrar ingreso
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Sueldo, freelance..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 text-sm"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="py-2 px-3 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {ingresosDelMes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Ingresos del mes</p>
          <ul className="space-y-1 text-sm">
            {ingresosDelMes.slice(0, 5).map((i) => (
              <li key={i.id} className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-slate-300 truncate">{i.descripcion}</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatearMonto(i.monto, moneda, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEliminarIngreso(i.id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
