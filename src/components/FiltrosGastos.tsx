import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { CATEGORIAS } from '../constants/categorias';
import { rangoEstaSemana, rangoMesActual } from '../utils/estadisticas';

export interface FiltrosGastosState {
  texto: string;
  categoria: string;
  fechaDesde: string;
  fechaHasta: string;
  montoMin: string;
  montoMax: string;
}

const emptyFiltros = (): FiltrosGastosState => ({
  texto: '',
  categoria: '',
  fechaDesde: '',
  fechaHasta: '',
  montoMin: '',
  montoMax: '',
});

type RangoRapido = 'hoy' | 'semana' | 'mes' | null;

function getRangoRapido(filtros: FiltrosGastosState): RangoRapido {
  const hoy = new Date().toISOString().split('T')[0];
  const { desde: semDesde, hasta: semHasta } = rangoEstaSemana();
  const { desde: mesDesde, hasta: mesHasta } = rangoMesActual();
  if (filtros.fechaDesde === hoy && filtros.fechaHasta === hoy) return 'hoy';
  if (filtros.fechaDesde === semDesde && filtros.fechaHasta === semHasta) return 'semana';
  if (filtros.fechaDesde === mesDesde && filtros.fechaHasta === mesHasta) return 'mes';
  return null;
}

function setRangoRapido(rango: RangoRapido): Pick<FiltrosGastosState, 'fechaDesde' | 'fechaHasta'> {
  const hoy = new Date().toISOString().split('T')[0];
  if (rango === 'hoy') return { fechaDesde: hoy, fechaHasta: hoy };
  if (rango === 'semana') {
    const { desde, hasta } = rangoEstaSemana();
    return { fechaDesde: desde, fechaHasta: hasta };
  }
  if (rango === 'mes') {
    const { desde, hasta } = rangoMesActual();
    return { fechaDesde: desde, fechaHasta: hasta };
  }
  return { fechaDesde: '', fechaHasta: '' };
}

interface FiltrosGastosProps {
  filtros: FiltrosGastosState;
  onChange: (f: FiltrosGastosState) => void;
  onClear: () => void;
  resultadosCount?: number;
}

export function FiltrosGastos({ filtros, onChange, onClear, resultadosCount }: FiltrosGastosProps) {
  const [expandido, setExpandido] = useState(false);
  const tieneFiltros =
    filtros.texto ||
    filtros.categoria ||
    filtros.fechaDesde ||
    filtros.fechaHasta ||
    filtros.montoMin ||
    filtros.montoMax;
  const rangoActivo = getRangoRapido(filtros);

  const aplicarRapido = (r: RangoRapido) => {
    const next = r === rangoActivo ? null : r;
    const { fechaDesde, fechaHasta } = setRangoRapido(next);
    onChange({ ...filtros, fechaDesde, fechaHasta });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-xl dark:hover:border-slate-600">
      {/* Barra siempre visible: búsqueda + chips + contador + toggle */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={filtros.texto}
              onChange={(e) => onChange({ ...filtros, texto: e.target.value })}
              placeholder="Buscar gastos..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-xl text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['hoy', 'semana', 'mes'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => aplicarRapido(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  rangoActivo === r
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {r === 'hoy' ? 'Hoy' : r === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
            {rangoActivo && (
              <button
                type="button"
                onClick={() => aplicarRapido(null)}
                className="px-2 py-1.5 rounded-full text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                title="Ver todo"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {resultadosCount !== undefined && (
            <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
              {resultadosCount} resultado{resultadosCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpandido((e) => !e)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-sm font-medium"
          >
            <SlidersHorizontal size={16} />
            {expandido ? 'Menos' : 'Más filtros'}
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Panel expandible */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-600/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Categoría</label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Desde</label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => onChange({ ...filtros, fechaDesde: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => onChange({ ...filtros, fechaHasta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Monto mín</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filtros.montoMin}
                    onChange={(e) => onChange({ ...filtros, montoMin: e.target.value })}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Máx</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filtros.montoMax}
                    onChange={(e) => onChange({ ...filtros, montoMax: e.target.value })}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            {tieneFiltros && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { emptyFiltros };
