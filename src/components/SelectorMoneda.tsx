import { MONEDAS } from '../constants/monedas';
import { Coins } from 'lucide-react';

interface SelectorMonedaProps {
  monedaActual: string;
  onCambiarMoneda: (codigo: string) => void;
}

export function SelectorMoneda({ monedaActual, onCambiarMoneda }: SelectorMonedaProps) {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Coins className="text-gray-600 hidden sm:block" size={20} />
      <select
        value={monedaActual}
        onChange={(e) => onCambiarMoneda(e.target.value)}
        className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {MONEDAS.map(moneda => (
          <option key={moneda.codigo} value={moneda.codigo}>
            {moneda.simbolo} {moneda.codigo} - {moneda.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
