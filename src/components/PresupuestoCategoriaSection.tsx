import { PresupuestoCategoria } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { Wallet } from 'lucide-react';

interface PresupuestoCategoriaSectionProps {
  presupuestosPorCategoria: PresupuestoCategoria[];
  gastoPorCategoria: Record<string, number>;
  moneda: Moneda;
  onGuardarLimite: (categoriaId: string, monto: number) => void;
  onQuitarLimite: (categoriaId: string) => void;
}

export function PresupuestoCategoriaSection({
  presupuestosPorCategoria,
  gastoPorCategoria,
  moneda,
  onGuardarLimite,
  onQuitarLimite,
}: PresupuestoCategoriaSectionProps) {
  const getLimite = (categoriaId: string) =>
    presupuestosPorCategoria.find((p) => p.categoriaId === categoriaId)?.monto ?? 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Wallet size={20} className="text-primary-500" />
        Presupuesto por categoría
      </h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Definí un tope por categoría para este mes. Si no ponés límite, no se controla.
      </p>
      <div className="space-y-3">
        {CATEGORIAS.map((cat) => {
          const gastado = gastoPorCategoria[cat.id] ?? 0;
          const limite = getLimite(cat.id);
          const sobrepasado = limite > 0 && gastado > limite;
          const porcentaje = limite > 0 ? Math.min(gastado / limite, 2) : 0;
          const cercaDelLimite = !sobrepasado && porcentaje >= 0.8;
          return (
            <div
              key={cat.id}
              className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{cat.icono}</span>
                  <span className="font-medium text-gray-800 dark:text-slate-200">{cat.nombre}</span>
                </div>
                {limite > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {sobrepasado && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 font-medium">
                        Superaste el límite
                      </span>
                    )}
                    {cercaDelLimite && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 font-medium">
                        Cerca del límite
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={sobrepasado ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-slate-400'}>
                  {formatearMonto(gastado, moneda, 0)} gastado
                </span>
                {limite > 0 && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-700 dark:text-slate-300">
                      límite {formatearMonto(limite, moneda, 0)}
                    </span>
                  </>
                )}
              </div>
              {limite > 0 && (
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sobrepasado
                        ? 'bg-red-500'
                        : porcentaje >= 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(porcentaje * 100, 100)}%` }}
                  />
                </div>
              )}
              <div className="flex gap-2 sm:ml-auto">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Límite"
                  defaultValue={limite || ''}
                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    if (v > 0) onGuardarLimite(cat.id, v);
                    else if (limite > 0) onQuitarLimite(cat.id);
                  }}
                />
                {limite > 0 && (
                  <button
                    type="button"
                    onClick={() => onQuitarLimite(cat.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
