import { GastoFijo } from '../types';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { Plus, Trash2 } from 'lucide-react';
import { CATEGORIAS } from '../constants/categorias';

interface GastosFijosSectionProps {
  gastosFijos: GastoFijo[];
  moneda: Moneda;
  onAgregar: (g: { descripcion: string; monto: number; categoria: string; diaVencimiento?: number }) => void;
  onEliminar: (id: string) => void;
}

export function GastosFijosSection({
  gastosFijos,
  moneda,
  onAgregar,
  onEliminar,
}: GastosFijosSectionProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const descripcion = (form.elements.namedItem('descripcionFijo') as HTMLInputElement).value.trim();
    const montoStr = (form.elements.namedItem('montoFijo') as HTMLInputElement).value;
    const categoria = (form.elements.namedItem('categoriaFijo') as HTMLSelectElement).value;
    const diaStr = (form.elements.namedItem('diaFijo') as HTMLInputElement).value;

    const monto = parseFloat(montoStr.replace(',', '.')) || 0;
    if (!descripcion || monto <= 0) return;

    const diaVencimiento = diaStr ? parseInt(diaStr, 10) : undefined;

    onAgregar({ descripcion, monto, categoria, diaVencimiento });

    form.reset();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100">Gastos fijos del mes</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Descripción</label>
          <input
            name="descripcionFijo"
            type="text"
            placeholder="Ej: Alquiler, Netflix..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Monto ({moneda.codigo})</label>
          <input
            name="montoFijo"
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Categoría</label>
            <select
              name="categoriaFijo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Día (opcional)</label>
            <input
              name="diaFijo"
              type="number"
              min="1"
              max="31"
              placeholder="1-31"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Agregar gasto fijo
          </button>
        </div>
      </form>

      {gastosFijos.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-600 pt-3 space-y-2">
          {gastosFijos.map((g) => {
            const catInfo = CATEGORIAS.find((c) => c.id === g.categoria);
            return (
              <div
                key={g.id}
                className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{catInfo?.icono || '📦'}</span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-slate-100">{g.descripcion}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {catInfo?.nombre || g.categoria}
                      {g.diaVencimiento && ` · Día ${g.diaVencimiento}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 dark:text-slate-100">
                    {formatearMonto(g.monto, moneda, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEliminar(g.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Eliminar gasto fijo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

