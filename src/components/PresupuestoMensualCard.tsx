import { PresupuestoMensual } from '../types';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { Gauge, WalletCards } from 'lucide-react';

interface PresupuestoMensualCardProps {
  presupuesto: PresupuestoMensual | null;
  totalGastado: number;
  restante: number;
  porcentajeUsado: number;
  moneda: Moneda;
  onActualizarPresupuesto: (monto: number) => void;
}

export function PresupuestoMensualCard({
  presupuesto,
  totalGastado,
  restante,
  porcentajeUsado,
  moneda,
  onActualizarPresupuesto,
}: PresupuestoMensualCardProps) {
  const mesActual = new Date();
  const nombreMes = mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(',', '.')) || 0;
    onActualizarPresupuesto(value);
  };

  const colorBarra =
    porcentajeUsado >= 100 ? 'bg-red-500' : porcentajeUsado >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-4 sm:p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary-100 dark:bg-primary-500/20 p-2 rounded-full">
            <WalletCards className="text-primary-600 dark:text-primary-400" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Presupuesto</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{nombreMes}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
          <Gauge size={16} className="text-primary-600 dark:text-primary-400" />
          <span>{porcentajeUsado.toFixed(0)}% usado</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
        <div>
          <p className="text-gray-500 dark:text-slate-400 mb-1">Presupuesto</p>
          <p className="font-bold text-gray-800 dark:text-slate-100">
            {formatearMonto(presupuesto?.monto ?? 0, moneda, 0)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-slate-400 mb-1">Gastado</p>
          <p className="font-bold text-gray-800 dark:text-slate-100">
            {formatearMonto(totalGastado, moneda, 0)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-slate-400 mb-1">Restante</p>
          <p className={`font-bold ${restante <= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {formatearMonto(restante, moneda, 0)}
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-1">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorBarra}`}
          style={{ width: `${porcentajeUsado}%` }}
        />
      </div>

      <div className="mt-2">
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
          Ajustar presupuesto mensual ({moneda.codigo})
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            defaultValue={presupuesto?.monto ?? 0}
            onBlur={handleChange}
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

