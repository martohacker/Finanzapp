import { PeriodoFiltro } from '../utils/estadisticas';
import { Calendar } from 'lucide-react';

interface SelectorPeriodoProps {
  periodo: PeriodoFiltro;
  onChange: (p: PeriodoFiltro) => void;
}

const opciones: { value: PeriodoFiltro; label: string }[] = [
  { value: 'mes', label: 'Este mes' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mesAnterior', label: 'Mes anterior' },
];

export function SelectorPeriodo({ periodo, onChange }: SelectorPeriodoProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={18} className="text-gray-500 dark:text-slate-400" />
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Período:</span>
      <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5">
        {opciones.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              periodo === opt.value
                ? 'bg-primary-600 dark:bg-primary-500 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
