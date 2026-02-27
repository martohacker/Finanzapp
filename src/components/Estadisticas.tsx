import { Estadisticas as EstadisticasType } from '../types';
import { CATEGORIAS } from '../constants/categorias';
import { Moneda } from '../constants/monedas';
import { formatearMonto } from '../utils/formato';
import { TrendingUp, Calendar, DollarSign, PieChart as PieChartIcon } from 'lucide-react';

interface EstadisticasProps {
  estadisticas: EstadisticasType;
  moneda: Moneda;
}

export function Estadisticas({ estadisticas, moneda }: EstadisticasProps) {

  const categoriaTop = Object.entries(estadisticas.gastoPorCategoria)
    .sort(([, a], [, b]) => b - a)[0];

  const categoriaTopNombre = categoriaTop && categoriaTop[1] > 0
    ? categoriaTop[0]
    : null;

  const cards = [
    {
      titulo: 'Total de Gastos',
      valor: formatearMonto(estadisticas.totalGastos, moneda, 0),
      icono: DollarSign,
      color: 'bg-blue-500',
    },
    {
      titulo: 'Gasto del Mes',
      valor: formatearMonto(estadisticas.gastoDelMes, moneda, 0),
      icono: Calendar,
      color: 'bg-green-500',
    },
    {
      titulo: 'Gasto de Hoy',
      valor: formatearMonto(estadisticas.gastoDelDia, moneda, 0),
      icono: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      titulo: 'Promedio Diario',
      valor: formatearMonto(estadisticas.promedioDiario, moneda, 0),
      icono: PieChartIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icono = card.icono;
          return (
            <div
              key={index}
<<<<<<< Updated upstream
              className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 hover:shadow-lg active:shadow-md transition-shadow touch-manipulation"
=======
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-6 hover:shadow-lg dark:hover:border-slate-600 transition-all"
>>>>>>> Stashed changes
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
<<<<<<< Updated upstream
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{card.titulo}</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 truncate">{card.valor}</p>
=======
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mb-1 truncate">{card.titulo}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 truncate">{card.valor}</p>
>>>>>>> Stashed changes
                </div>
                <div className={`${card.color} p-1.5 sm:p-2 md:p-3 rounded-full flex-shrink-0`}>
                  <Icono className="text-white" size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

<<<<<<< Updated upstream
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Desglose por Categoría</h3>
=======
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-slate-700 p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">Desglose por Categoría</h3>
>>>>>>> Stashed changes
        <div className="space-y-3">
          {Object.entries(estadisticas.gastoPorCategoria)
            .filter(([, monto]) => monto > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([categoriaId, monto]) => {
              const catInfo = CATEGORIAS.find(c => c.id === categoriaId);
              
              const totalCategorias = Object.values(estadisticas.gastoPorCategoria)
                .reduce((sum, m) => sum + m, 0);
              const porcentaje = totalCategorias > 0 
                ? (monto / totalCategorias) * 100 
                : 0;

              return (
                <div key={categoriaId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{catInfo?.icono || '📦'}</span>
                      <span className="font-semibold text-gray-700 dark:text-slate-200">
                        {catInfo?.nombre || categoriaId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-800 dark:text-slate-100">{formatearMonto(monto, moneda, 0)}</span>
                      <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">
                        ({porcentaje.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: catInfo?.color || '#64748b',
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {categoriaTopNombre && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Categoría con Mayor Gasto</h3>
          <p className="text-2xl font-bold">
            {CATEGORIAS.find(c => c.id === categoriaTopNombre)?.icono}{' '}
            {CATEGORIAS.find(c => c.id === categoriaTopNombre)?.nombre}
          </p>
          <p className="text-primary-100 dark:text-primary-200 mt-1">
            {formatearMonto(estadisticas.gastoPorCategoria[categoriaTopNombre], moneda, 0)}
          </p>
        </div>
      )}
    </div>
  );
}
