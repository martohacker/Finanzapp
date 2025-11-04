import { useState } from 'react';
import { Gasto } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda, MONEDAS } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { ConversionPesos } from './ConversionPesos';
import { EditarGasto } from './EditarGasto';
import { Trash2, Edit2 } from 'lucide-react';

interface GastoListProps {
  gastos: Gasto[];
  onEliminarGasto: (id: string) => void;
  onEditarGasto: (id: string, gasto: Omit<Gasto, 'id'>) => void;
  moneda: Moneda;
}

export function GastoList({ gastos, onEliminarGasto, onEditarGasto, moneda }: GastoListProps) {
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
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

  const obtenerMonedaGasto = (codigoMoneda?: string): Moneda => {
    if (!codigoMoneda) return moneda;
    return MONEDAS.find(m => m.codigo === codigoMoneda) || moneda;
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
          const monedaGasto = obtenerMonedaGasto(gasto.moneda);
          const mostrarConversion = monedaGasto.codigo !== 'ARS';
          
          return (
            <div
              key={gasto.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Icono de categoría */}
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                style={{ backgroundColor: categoria.color + '20' }}
              >
                {categoria.icono}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-800 truncate">{gasto.descripcion}</p>
                  <span
                    className="text-xs px-2 py-1 rounded-full text-white whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: categoria.color }}
                  >
                    {categoria.nombre}
                  </span>
                  {gasto.moneda && gasto.moneda !== moneda.codigo && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 whitespace-nowrap flex-shrink-0">
                      {monedaGasto.simbolo} {gasto.moneda}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{formatearFecha(gasto.fecha)}</p>
                
                {/* Conversión en móvil */}
                {mostrarConversion && (
                  <div className="sm:hidden mt-2">
                    <ConversionPesos 
                      monto={gasto.monto} 
                      monedaOrigen={monedaGasto} 
                    />
                  </div>
                )}
              </div>

              {/* Monto y acciones */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-left sm:text-right">
                  <p className="font-bold text-base sm:text-lg text-gray-900 whitespace-nowrap">
                    {formatearMonto(gasto.monto, monedaGasto)}
                  </p>
                  {mostrarConversion && (
                    <div className="hidden sm:block mt-1">
                      <ConversionPesos 
                        monto={gasto.monto} 
                        monedaOrigen={monedaGasto} 
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setGastoEditando(gasto)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar gasto"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onEliminarGasto(gasto.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar gasto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {gastoEditando && (
        <EditarGasto
          gasto={gastoEditando}
          onGuardar={(gastoActualizado) => {
            onEditarGasto(gastoEditando.id, gastoActualizado);
            setGastoEditando(null);
          }}
          onCancelar={() => setGastoEditando(null)}
        />
      )}
    </div>
  );
}
