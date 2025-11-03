import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { ConversionPesos } from './ConversionPesos';
import { Trash2 } from 'lucide-react';

interface GastoListProps {
  gastos: Gasto[];
  onEliminarGasto: (id: string) => void;
  moneda: Moneda;
}

export function GastoList({ gastos, onEliminarGasto, moneda }: GastoListProps) {
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const obtenerCategoria = (categoriaId: string) => {
    return CATEGORIAS.find(c => c.id === categoriaId) || CATEGORIAS[CATEGORIAS.length - 1];
  };

  if (gastos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">No hay gastos registrados aún</p>
        <p className="text-gray-400 text-sm mt-2">Agrega tu primer gasto usando el formulario</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Gastos Recientes</h2>
      <div className="space-y-3">
        {gastos.map(gasto => {
          const categoria = obtenerCategoria(gasto.categoria);
          return (
            <div
              key={gasto.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-0"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                  style={{ backgroundColor: categoria.color + '20' }}
                >
                  {categoria.icono}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <p className="font-semibold text-gray-800 truncate">{gasto.descripcion}</p>
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white self-start sm:self-auto"
                      style={{ backgroundColor: categoria.color }}
                    >
                      {categoria.nombre}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">{formatearFecha(gasto.fecha)}</p>
                </div>
                <div className="text-right sm:text-left w-full sm:w-auto flex sm:block items-center justify-between sm:justify-start">
                  <div>
                    <p className="font-bold text-base sm:text-lg text-gray-900">{formatearMonto(gasto.monto, moneda)}</p>
                    {moneda.codigo !== 'ARS' && (
                      <div className="sm:hidden mt-1">
                        <ConversionPesos 
                          monto={gasto.monto} 
                          monedaOrigen={moneda} 
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onEliminarGasto(gasto.id)}
                    className="sm:hidden p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar gasto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden sm:block">
                  {moneda.codigo !== 'ARS' && (
                    <ConversionPesos 
                      monto={gasto.monto} 
                      monedaOrigen={moneda} 
                    />
                  )}
                </div>
                <button
                  onClick={() => onEliminarGasto(gasto.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar gasto"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
